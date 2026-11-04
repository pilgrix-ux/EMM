#include <jni.h>
#include <GLES3/gl3.h>
#include <android/log.h>

#include <algorithm>
#include <array>
#include <cmath>
#include <cstddef>
#include <cstdint>
#include <vector>

namespace {
constexpr char kLogTag[] = "EMM-World";
constexpr float kPi = 3.14159265358979323846f;

GLuint gProgram = 0;
GLuint gVertexArray = 0;
GLuint gVertexBuffer = 0;
GLuint gIndexBuffer = 0;
GLint gMvpLocation = -1;
GLint gViewLocation = -1;
GLsizei gIndexCount = 0;
int gWidth = 1;
int gHeight = 1;
float gCameraYaw = 0.35f;
float gCameraPitch = 0.48f;
float gCameraDistance = 88.0f;

struct Vec3 { float x, y, z; };
struct Color { float r, g, b; };
struct Vertex {
    float position[3];
    float normal[3];
    float color[3];
};
using Mat4 = std::array<float, 16>;

std::vector<Vertex> gVertices;
std::vector<std::uint32_t> gIndices;

Vec3 add(Vec3 a, Vec3 b) { return {a.x + b.x, a.y + b.y, a.z + b.z}; }
Vec3 sub(Vec3 a, Vec3 b) { return {a.x - b.x, a.y - b.y, a.z - b.z}; }
Vec3 scale(Vec3 a, float s) { return {a.x * s, a.y * s, a.z * s}; }
float dot(Vec3 a, Vec3 b) { return a.x*b.x + a.y*b.y + a.z*b.z; }
Vec3 cross(Vec3 a, Vec3 b) {
    return {a.y*b.z-a.z*b.y, a.z*b.x-a.x*b.z, a.x*b.y-a.y*b.x};
}
Vec3 normalize(Vec3 v) {
    const float length = std::sqrt(std::max(0.000001f, dot(v, v)));
    return scale(v, 1.0f / length);
}
Color tint(Color c, float amount) {
    return {std::clamp(c.r * amount, 0.0f, 1.0f),
            std::clamp(c.g * amount, 0.0f, 1.0f),
            std::clamp(c.b * amount, 0.0f, 1.0f)};
}

void pushVertex(Vec3 p, Vec3 n, Color c) {
    Vertex v{};
    v.position[0] = p.x; v.position[1] = p.y; v.position[2] = p.z;
    n = normalize(n);
    v.normal[0] = n.x; v.normal[1] = n.y; v.normal[2] = n.z;
    v.color[0] = c.r; v.color[1] = c.g; v.color[2] = c.b;
    gIndices.push_back(static_cast<std::uint32_t>(gVertices.size()));
    gVertices.push_back(v);
}

void triangle(Vec3 a, Vec3 b, Vec3 c, Color color) {
    const Vec3 normal = normalize(cross(sub(b, a), sub(c, a)));
    pushVertex(a, normal, color);
    pushVertex(b, normal, color);
    pushVertex(c, normal, color);
}

void quad(Vec3 a, Vec3 b, Vec3 c, Vec3 d, Color color) {
    triangle(a, b, c, color);
    triangle(a, c, d, color);
}

void box(float cx, float cy, float cz, float sx, float sy, float sz, Color color) {
    const float x0=cx-sx*0.5f, x1=cx+sx*0.5f;
    const float y0=cy-sy*0.5f, y1=cy+sy*0.5f;
    const float z0=cz-sz*0.5f, z1=cz+sz*0.5f;
    quad({x0,y0,z1},{x1,y0,z1},{x1,y1,z1},{x0,y1,z1},tint(color,1.06f));
    quad({x1,y0,z0},{x0,y0,z0},{x0,y1,z0},{x1,y1,z0},tint(color,0.72f));
    quad({x0,y0,z0},{x0,y0,z1},{x0,y1,z1},{x0,y1,z0},tint(color,0.84f));
    quad({x1,y0,z1},{x1,y0,z0},{x1,y1,z0},{x1,y1,z1},tint(color,0.92f));
    quad({x0,y1,z1},{x1,y1,z1},{x1,y1,z0},{x0,y1,z0},tint(color,1.22f));
    quad({x0,y0,z0},{x1,y0,z0},{x1,y0,z1},{x0,y0,z1},tint(color,0.62f));
}

void cylinder(float cx, float y0, float cz, float radius, float height,
              Color color, int segments = 12) {
    const float y1 = y0 + height;
    for (int i=0; i<segments; ++i) {
        const float a0=2.0f*kPi*static_cast<float>(i)/segments;
        const float a1=2.0f*kPi*static_cast<float>(i+1)/segments;
        const Vec3 p0{cx+std::cos(a0)*radius,y0,cz+std::sin(a0)*radius};
        const Vec3 p1{cx+std::cos(a1)*radius,y0,cz+std::sin(a1)*radius};
        const Vec3 p2{p1.x,y1,p1.z}, p3{p0.x,y1,p0.z};
        quad(p0,p1,p2,p3,tint(color,0.92f+0.12f*std::sin(a0)));
        triangle({cx,y1,cz},p3,p2,tint(color,1.15f));
        triangle({cx,y0,cz},p1,p0,tint(color,0.62f));
    }
}

void sphere(Vec3 center, Vec3 radii, Color color, int rings=8, int segments=12) {
    for (int r=0; r<rings; ++r) {
        const float p0=-0.5f*kPi+kPi*static_cast<float>(r)/rings;
        const float p1=-0.5f*kPi+kPi*static_cast<float>(r+1)/rings;
        for (int s=0; s<segments; ++s) {
            const float t0=2.0f*kPi*static_cast<float>(s)/segments;
            const float t1=2.0f*kPi*static_cast<float>(s+1)/segments;
            auto point=[&](float p,float t) {
                return Vec3{center.x+radii.x*std::cos(p)*std::cos(t),
                            center.y+radii.y*std::sin(p),
                            center.z+radii.z*std::cos(p)*std::sin(t)};
            };
            quad(point(p0,t0),point(p0,t1),point(p1,t1),point(p1,t0),color);
        }
    }
}

float terrainHeight(float x, float z) {
    const float radius = std::sqrt(x*x + z*z);
    const float edge = std::clamp((radius-28.0f)/28.0f,0.0f,1.0f);
    const float rolling = 0.34f*std::sin(x*0.105f)*std::cos(z*0.087f)
                        + 0.20f*std::sin((x+z)*0.16f);
    return edge * (1.5f + rolling*2.0f);
}

void terrain() {
    constexpr int cells=76;
    constexpr float extent=58.0f;
    const float step=2.0f*extent/cells;
    for (int z=0; z<cells; ++z) {
        for (int x=0; x<cells; ++x) {
            const float x0=-extent+x*step, x1=x0+step;
            const float z0=-extent+z*step, z1=z0+step;
            const Vec3 a{x0,terrainHeight(x0,z0),z0};
            const Vec3 b{x1,terrainHeight(x1,z0),z0};
            const Vec3 c{x1,terrainHeight(x1,z1),z1};
            const Vec3 d{x0,terrainHeight(x0,z1),z1};
            const float variation=0.94f+0.06f*std::sin(x0*0.31f+z0*0.17f);
            const Color ground=tint({0.30f,0.34f,0.25f},variation);
            quad(a,b,c,d,ground);
        }
    }
}

void road(float cx, float cz, float sx, float sz) {
    const float y=0.075f;
    box(cx,y-0.045f,cz,sx,0.09f,sz,{0.30f,0.32f,0.32f});
    if (sx>sz) {
        for (float x=cx-sx*0.5f+2.0f; x<cx+sx*0.5f-1.0f; x+=5.0f)
            box(x,y+0.012f,cz,2.1f,0.025f,0.16f,{0.78f,0.70f,0.48f});
    } else {
        for (float z=cz-sz*0.5f+2.0f; z<cz+sz*0.5f-1.0f; z+=5.0f)
            box(cx,y+0.012f,z,0.16f,0.025f,2.1f,{0.78f,0.70f,0.48f});
    }
}

void warehouse(float x, float z, float width, float depth, float height) {
    box(x,height*0.5f,z,width,height,depth,{0.36f,0.39f,0.39f});
    box(x,height+0.34f,z,width+1.2f,0.68f,depth+1.2f,{0.22f,0.25f,0.27f});
    box(x,0.28f,z,width+1.5f,0.56f,depth+1.5f,{0.42f,0.40f,0.34f});
    box(x,2.7f,z+depth*0.5f+0.035f,width*0.42f,4.7f,0.12f,{0.15f,0.19f,0.20f});
    box(x,2.7f,z+depth*0.5f+0.11f,width*0.36f,4.25f,0.08f,{0.47f,0.43f,0.34f});
    for (int i=-2;i<=2;++i) {
        const float wx=x+i*width*0.15f;
        box(wx,height*0.70f,z-depth*0.5f-0.07f,width*0.075f,1.0f,0.12f,{0.16f,0.25f,0.29f});
    }
    for (int i=0;i<9;++i) {
        const float px=x-width*0.44f+i*width*0.11f;
        box(px,height*0.52f,z+depth*0.5f+0.09f,0.10f,height*0.88f,0.12f,{0.25f,0.29f,0.29f});
    }
    box(x-width*0.25f,0.65f,z+depth*0.5f+0.20f,width*0.08f,0.14f,0.12f,{0.88f,0.53f,0.18f});
    box(x+width*0.25f,0.65f,z+depth*0.5f+0.20f,width*0.08f,0.14f,0.12f,{0.88f,0.53f,0.18f});
}

void shippingContainer(float x,float z,Color color) {
    box(x,2.65f,z,13.0f,5.2f,5.5f,color);
    for (int i=0;i<27;++i) {
        const float px=x-6.25f+i*0.48f;
        box(px,2.65f,z+2.79f,0.075f,4.9f,0.08f,tint(color,0.72f));
    }
    box(x,2.65f,z-2.80f,0.16f,4.9f,0.12f,{0.18f,0.22f,0.23f});
    for (int i=-1;i<=1;++i)
        box(x+i*0.18f,2.65f,z-2.9f,0.055f,4.45f,0.08f,{0.56f,0.53f,0.43f});
}

void fenceLine(float x0,float z0,float x1,float z1) {
    const float dx=x1-x0, dz=z1-z0;
    const float length=std::sqrt(dx*dx+dz*dz);
    const int posts=static_cast<int>(length/4.0f);
    for (int i=0;i<=posts;++i) {
        const float t=static_cast<float>(i)/std::max(1,posts);
        const float x=x0+dx*t, z=z0+dz*t;
        box(x,1.25f,z,0.18f,2.5f,0.18f,{0.25f,0.28f,0.27f});
    }
    box((x0+x1)*0.5f,2.0f,(z0+z1)*0.5f,length,0.12f,0.12f,{0.34f,0.37f,0.35f});
    box((x0+x1)*0.5f,0.85f,(z0+z1)*0.5f,length,0.10f,0.10f,{0.34f,0.37f,0.35f});
}

void watchTower(float x,float z) {
    for (int dx=-1;dx<=1;dx+=2)
        for (int dz=-1;dz<=1;dz+=2)
            cylinder(x+dx*1.35f,0.0f,z+dz*1.35f,0.10f,7.0f,{0.27f,0.30f,0.29f},8);
    box(x,6.9f,z,3.6f,0.35f,3.6f,{0.29f,0.32f,0.30f});
    box(x,8.0f,z,3.0f,2.0f,3.0f,{0.31f,0.35f,0.34f});
    box(x,9.1f,z,3.4f,0.18f,3.4f,{0.19f,0.23f,0.23f});
    for (int i=0;i<5;++i)
        box(x-0.8f+i*0.4f,7.9f,z+1.53f,0.12f,1.2f,0.08f,{0.13f,0.18f,0.19f});
}

void tree(float x,float z,float size) {
    cylinder(x,terrainHeight(x,z),z,0.22f*size,2.5f*size,{0.27f,0.20f,0.13f},9);
    sphere({x,terrainHeight(x,z)+3.0f*size,z},
           {1.55f*size,2.0f*size,1.45f*size},{0.20f,0.29f,0.19f},7,10);
    sphere({x+0.8f*size,terrainHeight(x,z)+2.7f*size,z+0.25f*size},
           {0.95f*size,1.25f*size,0.9f*size},{0.24f,0.33f,0.21f},6,9);
}

void lightPole(float x,float z) {
    cylinder(x,0.0f,z,0.10f,8.5f,{0.22f,0.25f,0.26f},8);
    box(x,8.5f,z,1.2f,0.12f,0.28f,{0.20f,0.23f,0.24f});
    sphere({x,8.35f,z},{0.25f,0.12f,0.25f},{0.95f,0.78f,0.48f},5,8);
}

void buildWorld() {
    gVertices.clear();
    gIndices.clear();
    terrain();

    road(0.0f,0.0f,7.0f,105.0f);
    road(0.0f,-13.0f,88.0f,6.0f);
    road(0.0f,22.0f,70.0f,5.0f);

    warehouse(-24.0f,-20.0f,20.0f,19.0f,9.0f);
    warehouse(25.0f,-31.0f,15.0f,14.0f,7.0f);

    shippingContainer(-8.0f,-24.0f,{0.48f,0.25f,0.16f});
    shippingContainer(9.0f,-31.0f,{0.23f,0.34f,0.35f});
    shippingContainer(18.0f,2.0f,{0.47f,0.37f,0.18f});
    shippingContainer(-17.0f,17.0f,{0.30f,0.35f,0.32f});

    fenceLine(-43.0f,-43.0f,43.0f,-43.0f);
    fenceLine(-43.0f,-43.0f,-43.0f,43.0f);
    fenceLine(43.0f,-43.0f,43.0f,43.0f);
    fenceLine(-43.0f,43.0f,-14.0f,43.0f);
    fenceLine(14.0f,43.0f,43.0f,43.0f);
    box(0.0f,1.6f,43.0f,27.0f,3.2f,0.8f,{0.39f,0.38f,0.32f});
    box(-7.0f,2.0f,42.45f,0.35f,4.0f,0.18f,{0.22f,0.25f,0.24f});
    box(7.0f,2.0f,42.45f,0.35f,4.0f,0.18f,{0.22f,0.25f,0.24f});

    watchTower(-39.0f,-39.0f);
    watchTower(39.0f,-39.0f);
    watchTower(-39.0f,39.0f);
    watchTower(39.0f,39.0f);

    // Central objective yard and low cover.
    box(0.0f,0.25f,3.0f,13.0f,0.5f,10.0f,{0.38f,0.39f,0.35f});
    box(0.0f,0.72f,3.0f,4.2f,0.45f,4.2f,{0.23f,0.29f,0.28f});
    box(0.0f,1.7f,3.0f,2.2f,1.6f,2.2f,{0.43f,0.35f,0.22f});
    box(0.0f,2.65f,3.0f,2.5f,0.18f,2.5f,{0.18f,0.23f,0.23f});
    for (int i=0;i<6;++i) {
        const float x=-13.0f+i*5.2f;
        box(x,0.7f,11.0f,3.0f,1.4f,1.1f,{0.43f,0.40f,0.31f});
        box(x,0.7f,-5.0f,3.0f,1.4f,1.1f,{0.43f,0.40f,0.31f});
    }

    // Concrete barriers, crates and drums form readable cover lanes.
    for (int i=0;i<5;++i) {
        const float x=-31.0f+i*4.0f;
        box(x,0.75f,3.0f,2.6f,1.5f,1.0f,{0.48f,0.45f,0.35f});
    }
    for (int i=0;i<4;++i) {
        const float x=22.0f+(i%2)*3.0f;
        const float z=13.0f+(i/2)*3.0f;
        box(x,0.8f,z,2.0f,1.6f,2.0f,{0.38f,0.29f,0.19f});
        box(x,1.65f,z,2.05f,0.12f,2.05f,{0.27f,0.22f,0.16f});
    }
    for (int i=0;i<10;++i) {
        const float x=-30.0f+(i%5)*2.2f;
        const float z=26.0f+(i/5)*2.5f;
        cylinder(x,0.0f,z,0.62f,1.45f,
                 (i%2==0)?Color{0.49f,0.24f,0.13f}:Color{0.31f,0.36f,0.34f},12);
        cylinder(x,1.40f,z,0.64f,0.08f,{0.20f,0.22f,0.21f},12);
    }

    // Utility structures and perimeter details.
    for (int i=0;i<6;++i) {
        lightPole(-32.0f+i*12.8f,-5.0f);
        lightPole(-32.0f+i*12.8f,34.0f);
    }
    for (int i=0;i<18;++i) {
        const float x=-52.0f+i*6.0f;
        if (std::abs(x)>46.0f) continue;
        tree(x,50.0f+(i%3)*1.8f,0.8f+(i%3)*0.12f);
        tree(x,-51.0f-(i%2)*2.0f,0.75f+(i%4)*0.08f);
    }
    for (int i=0;i<16;++i) {
        const float x=-51.0f+(i%4)*2.4f;
        const float z=-32.0f+(i/4)*3.0f;
        sphere({x,terrainHeight(x,z)+0.45f,z},
               {1.2f,0.75f,1.0f},{0.31f,0.32f,0.29f},5,7);
    }
}

GLuint compileShader(GLenum type,const char* source) {
    GLuint shader=glCreateShader(type);
    glShaderSource(shader,1,&source,nullptr);
    glCompileShader(shader);
    GLint ok=GL_FALSE;
    glGetShaderiv(shader,GL_COMPILE_STATUS,&ok);
    if (ok!=GL_TRUE) {
        GLint length=0; glGetShaderiv(shader,GL_INFO_LOG_LENGTH,&length);
        std::vector<GLchar> log(static_cast<size_t>(std::max(1,length)));
        glGetShaderInfoLog(shader,length,nullptr,log.data());
        __android_log_print(ANDROID_LOG_ERROR,kLogTag,"Shader error: %s",log.data());
        glDeleteShader(shader);
        return 0;
    }
    return shader;
}

GLuint createProgram() {
    static constexpr char vertexSource[]=R"(
        #version 300 es
        precision highp float;
        layout(location=0) in vec3 aPosition;
        layout(location=1) in vec3 aNormal;
        layout(location=2) in vec3 aColor;
        uniform mat4 uMvp;
        uniform mat4 uView;
        out vec3 vNormal;
        out vec3 vColor;
        out vec3 vViewPosition;
        void main() {
            vec4 viewPosition=uView*vec4(aPosition,1.0);
            vViewPosition=viewPosition.xyz;
            vNormal=mat3(uView)*aNormal;
            vColor=aColor;
            gl_Position=uMvp*vec4(aPosition,1.0);
        })";
    static constexpr char fragmentSource[]=R"(
        #version 300 es
        precision highp float;
        in vec3 vNormal;
        in vec3 vColor;
        in vec3 vViewPosition;
        out vec4 outColor;
        void main() {
            vec3 n=normalize(vNormal);
            vec3 light=normalize(vec3(-0.42,0.82,0.36));
            float diffuse=max(dot(n,light),0.0);
            float fill=max(dot(n,normalize(vec3(0.4,0.25,-0.7))),0.0);
            vec3 color=vColor*(0.38+0.66*diffuse+0.12*fill);
            float distanceToCamera=length(vViewPosition);
            float fog=clamp(exp(-distanceToCamera*0.009),0.0,1.0);
            vec3 sky=vec3(0.48,0.64,0.72);
            color=mix(sky,color,fog);
            outColor=vec4(color,1.0);
        })";
    GLuint vs=compileShader(GL_VERTEX_SHADER,vertexSource);
    if (!vs) return 0;
    GLuint fs=compileShader(GL_FRAGMENT_SHADER,fragmentSource);
    if (!fs) { glDeleteShader(vs); return 0; }
    GLuint program=glCreateProgram();
    glAttachShader(program,vs); glAttachShader(program,fs); glLinkProgram(program);
    glDeleteShader(vs); glDeleteShader(fs);
    GLint linked=GL_FALSE; glGetProgramiv(program,GL_LINK_STATUS,&linked);
    if (linked!=GL_TRUE) {
        GLint length=0; glGetProgramiv(program,GL_INFO_LOG_LENGTH,&length);
        std::vector<GLchar> log(static_cast<size_t>(std::max(1,length)));
        glGetProgramInfoLog(program,length,nullptr,log.data());
        __android_log_print(ANDROID_LOG_ERROR,kLogTag,"Link error: %s",log.data());
        glDeleteProgram(program); return 0;
    }
    return program;
}

Mat4 identity() {
    Mat4 m{}; m[0]=m[5]=m[10]=m[15]=1.0f; return m;
}
Mat4 multiply(const Mat4& a,const Mat4& b) {
    Mat4 out{};
    for(int c=0;c<4;++c) for(int r=0;r<4;++r)
        for(int k=0;k<4;++k) out[c*4+r]+=a[k*4+r]*b[c*4+k];
    return out;
}
Mat4 perspective(float fov,float aspect,float nearPlane,float farPlane) {
    Mat4 m{};
    const float f=1.0f/std::tan(fov*0.5f);
    m[0]=f/aspect; m[5]=f;
    m[10]=(farPlane+nearPlane)/(nearPlane-farPlane);
    m[11]=-1.0f;
    m[14]=(2.0f*farPlane*nearPlane)/(nearPlane-farPlane);
    return m;
}
Mat4 lookAt(Vec3 eye,Vec3 target,Vec3 up) {
    const Vec3 f=normalize(sub(target,eye));
    const Vec3 s=normalize(cross(f,up));
    const Vec3 u=cross(s,f);
    Mat4 m=identity();
    m[0]=s.x; m[1]=u.x; m[2]=-f.x;
    m[4]=s.y; m[5]=u.y; m[6]=-f.y;
    m[8]=s.z; m[9]=u.z; m[10]=-f.z;
    m[12]=-dot(s,eye); m[13]=-dot(u,eye); m[14]=dot(f,eye);
    return m;
}

void uploadWorld() {
    glGenVertexArrays(1,&gVertexArray);
    glGenBuffers(1,&gVertexBuffer);
    glGenBuffers(1,&gIndexBuffer);
    glBindVertexArray(gVertexArray);
    glBindBuffer(GL_ARRAY_BUFFER,gVertexBuffer);
    glBufferData(GL_ARRAY_BUFFER,
        static_cast<GLsizeiptr>(gVertices.size()*sizeof(Vertex)),
        gVertices.data(),GL_STATIC_DRAW);
    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER,gIndexBuffer);
    glBufferData(GL_ELEMENT_ARRAY_BUFFER,
        static_cast<GLsizeiptr>(gIndices.size()*sizeof(std::uint32_t)),
        gIndices.data(),GL_STATIC_DRAW);
    glEnableVertexAttribArray(0);
    glVertexAttribPointer(0,3,GL_FLOAT,GL_FALSE,sizeof(Vertex),
        reinterpret_cast<void*>(offsetof(Vertex,position)));
    glEnableVertexAttribArray(1);
    glVertexAttribPointer(1,3,GL_FLOAT,GL_FALSE,sizeof(Vertex),
        reinterpret_cast<void*>(offsetof(Vertex,normal)));
    glEnableVertexAttribArray(2);
    glVertexAttribPointer(2,3,GL_FLOAT,GL_FALSE,sizeof(Vertex),
        reinterpret_cast<void*>(offsetof(Vertex,color)));
    glBindVertexArray(0);
    gIndexCount=static_cast<GLsizei>(gIndices.size());
}

void initializeRenderer() {
    gProgram=createProgram();
    if (!gProgram) {
        __android_log_print(ANDROID_LOG_ERROR,kLogTag,"World shader initialization failed.");
        return;
    }
    gMvpLocation=glGetUniformLocation(gProgram,"uMvp");
    gViewLocation=glGetUniformLocation(gProgram,"uView");
    buildWorld();
    uploadWorld();
    glEnable(GL_DEPTH_TEST);
    glDepthFunc(GL_LEQUAL);
    glDisable(GL_CULL_FACE);
    glClearColor(0.48f,0.64f,0.72f,1.0f);
    __android_log_print(ANDROID_LOG_INFO,kLogTag,
        "EMM industrial-yard environment ready: %zu vertices, %zu indices.",
        gVertices.size(),gIndices.size());
}

} // namespace

extern "C" JNIEXPORT void JNICALL
Java_com_pilgrix_emm_MainActivity_nativeOnSurfaceCreated(JNIEnv*,jobject) {
    initializeRenderer();
}
extern "C" JNIEXPORT void JNICALL
Java_com_pilgrix_emm_MainActivity_nativeOnSurfaceChanged(
    JNIEnv*,jobject,jint width,jint height) {
    gWidth=std::max(1,static_cast<int>(width));
    gHeight=std::max(1,static_cast<int>(height));
    glViewport(0,0,gWidth,gHeight);
}
extern "C" JNIEXPORT void JNICALL
Java_com_pilgrix_emm_MainActivity_nativeOnDrawFrame(
    JNIEnv*,jobject,jfloat) {
    glClear(GL_COLOR_BUFFER_BIT|GL_DEPTH_BUFFER_BIT);
    if (!gProgram || !gVertexArray || !gIndexCount) return;

    const float cp=std::cos(gCameraPitch);
    const Vec3 eye{
        std::sin(gCameraYaw)*cp*gCameraDistance,
        std::sin(gCameraPitch)*gCameraDistance,
        std::cos(gCameraYaw)*cp*gCameraDistance
    };
    const Mat4 view=lookAt(eye,{0.0f,0.0f,0.0f},{0.0f,1.0f,0.0f});
    const Mat4 projection=perspective(0.78539816339f,
        static_cast<float>(gWidth)/static_cast<float>(gHeight),0.1f,220.0f);
    const Mat4 mvp=multiply(projection,view);

    glUseProgram(gProgram);
    glUniformMatrix4fv(gViewLocation,1,GL_FALSE,view.data());
    glUniformMatrix4fv(gMvpLocation,1,GL_FALSE,mvp.data());
    glBindVertexArray(gVertexArray);
    glDrawElements(GL_TRIANGLES,gIndexCount,GL_UNSIGNED_INT,nullptr);
    glBindVertexArray(0);
}
extern "C" JNIEXPORT void JNICALL
Java_com_pilgrix_emm_MainActivity_nativeAddTouch(
    JNIEnv*,jobject,jfloat deltaX,jfloat deltaY) {
    gCameraYaw-=deltaX*3.4f;
    gCameraPitch=std::clamp(gCameraPitch+deltaY*2.0f,0.18f,1.15f);
}
