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

constexpr char kLogTag[] = "EMM-Native";
constexpr float kPi = 3.14159265358979323846f;

GLuint gProgram = 0;
GLuint gVertexArray = 0;
GLuint gVertexBuffer = 0;
GLuint gIndexBuffer = 0;
GLint gMvpLocation = -1;
GLint gModelLocation = -1;
GLsizei gIndexCount = 0;
int gWidth = 1;
int gHeight = 1;
float gTouchYaw = 0.0f;
float gTouchPitch = 0.0f;

struct Vertex {
    float position[3];
    float normal[3];
};

using Mat4 = std::array<float, 16>;

void logError(const char* message) {
    __android_log_print(ANDROID_LOG_ERROR, kLogTag, "%s", message);
}

GLuint compileShader(GLenum type, const char* source) {
    const GLuint shader = glCreateShader(type);
    if (shader == 0) {
        logError("glCreateShader failed.");
        return 0;
    }

    glShaderSource(shader, 1, &source, nullptr);
    glCompileShader(shader);

    GLint compiled = GL_FALSE;
    glGetShaderiv(shader, GL_COMPILE_STATUS, &compiled);
    if (compiled != GL_TRUE) {
        GLint logLength = 0;
        glGetShaderiv(shader, GL_INFO_LOG_LENGTH, &logLength);
        std::vector<GLchar> info(static_cast<size_t>(std::max(1, logLength)));
        glGetShaderInfoLog(shader, logLength, nullptr, info.data());
        __android_log_print(ANDROID_LOG_ERROR, kLogTag,
                            "Shader compilation failed: %s", info.data());
        glDeleteShader(shader);
        return 0;
    }

    return shader;
}

GLuint createProgram() {
    static constexpr char kVertexShader[] = R"(
        #version 300 es
        precision highp float;

        layout(location = 0) in vec3 aPosition;
        layout(location = 1) in vec3 aNormal;

        uniform mat4 uMvp;
        uniform mat4 uModel;

        out vec3 vNormal;
        out vec3 vViewPosition;

        void main() {
            vec4 viewPosition = uModel * vec4(aPosition, 1.0);
            vViewPosition = viewPosition.xyz;
            vNormal = mat3(uModel) * aNormal;
            gl_Position = uMvp * vec4(aPosition, 1.0);
        }
    )";

    static constexpr char kFragmentShader[] = R"(
        #version 300 es
        precision highp float;

        in vec3 vNormal;
        in vec3 vViewPosition;

        out vec4 outColor;

        void main() {
            vec3 normal = normalize(vNormal);
            vec3 lightDirection = normalize(vec3(-0.45, 0.72, 0.62));
            vec3 viewDirection = normalize(-vViewPosition);
            vec3 halfDirection = normalize(lightDirection + viewDirection);

            float diffuse = max(dot(normal, lightDirection), 0.0);
            float specular = pow(max(dot(normal, halfDirection), 0.0), 48.0);
            float rim = pow(1.0 - max(dot(normal, viewDirection), 0.0), 2.0);

            vec3 baseColor = vec3(0.12, 0.48, 0.66);
            vec3 color = baseColor * (0.20 + diffuse * 0.78);
            color += vec3(0.75, 0.88, 1.0) * specular * 0.34;
            color += vec3(0.04, 0.20, 0.30) * rim * 0.62;

            outColor = vec4(color, 1.0);
        }
    )";

    const GLuint vertex = compileShader(GL_VERTEX_SHADER, kVertexShader);
    if (vertex == 0) {
        return 0;
    }

    const GLuint fragment = compileShader(GL_FRAGMENT_SHADER, kFragmentShader);
    if (fragment == 0) {
        glDeleteShader(vertex);
        return 0;
    }

    const GLuint program = glCreateProgram();
    glAttachShader(program, vertex);
    glAttachShader(program, fragment);
    glLinkProgram(program);

    glDeleteShader(vertex);
    glDeleteShader(fragment);

    GLint linked = GL_FALSE;
    glGetProgramiv(program, GL_LINK_STATUS, &linked);
    if (linked != GL_TRUE) {
        GLint logLength = 0;
        glGetProgramiv(program, GL_INFO_LOG_LENGTH, &logLength);
        std::vector<GLchar> info(static_cast<size_t>(std::max(1, logLength)));
        glGetProgramInfoLog(program, logLength, nullptr, info.data());
        __android_log_print(ANDROID_LOG_ERROR, kLogTag,
                            "Program link failed: %s", info.data());
        glDeleteProgram(program);
        return 0;
    }

    return program;
}

void buildSphere(std::vector<Vertex>& vertices,
                 std::vector<std::uint16_t>& indices,
                 int latitudeSegments,
                 int longitudeSegments) {
    vertices.clear();
    indices.clear();

    vertices.reserve(static_cast<size_t>((latitudeSegments + 1)
                                          * (longitudeSegments + 1)));
    indices.reserve(static_cast<size_t>(latitudeSegments
                                        * longitudeSegments * 6));

    for (int latitude = 0; latitude <= latitudeSegments; ++latitude) {
        const float v = static_cast<float>(latitude)
                        / static_cast<float>(latitudeSegments);
        const float phi = v * kPi;
        const float ringRadius = std::sin(phi);
        const float y = std::cos(phi);

        for (int longitude = 0; longitude <= longitudeSegments; ++longitude) {
            const float u = static_cast<float>(longitude)
                            / static_cast<float>(longitudeSegments);
            const float theta = u * 2.0f * kPi;

            const float x = ringRadius * std::cos(theta);
            const float z = ringRadius * std::sin(theta);

            Vertex vertex{};
            vertex.position[0] = x;
            vertex.position[1] = y;
            vertex.position[2] = z;
            vertex.normal[0] = x;
            vertex.normal[1] = y;
            vertex.normal[2] = z;
            vertices.push_back(vertex);
        }
    }

    for (int latitude = 0; latitude < latitudeSegments; ++latitude) {
        for (int longitude = 0; longitude < longitudeSegments; ++longitude) {
            const std::uint16_t first = static_cast<std::uint16_t>(
                    latitude * (longitudeSegments + 1) + longitude);
            const std::uint16_t second = static_cast<std::uint16_t>(
                    first + longitudeSegments + 1);

            indices.push_back(first);
            indices.push_back(second);
            indices.push_back(static_cast<std::uint16_t>(first + 1));

            indices.push_back(static_cast<std::uint16_t>(first + 1));
            indices.push_back(second);
            indices.push_back(static_cast<std::uint16_t>(second + 1));
        }
    }
}

void createMesh() {
    std::vector<Vertex> vertices;
    std::vector<std::uint16_t> indices;
    buildSphere(vertices, indices, 32, 48);

    glGenVertexArrays(1, &gVertexArray);
    glGenBuffers(1, &gVertexBuffer);
    glGenBuffers(1, &gIndexBuffer);

    glBindVertexArray(gVertexArray);

    glBindBuffer(GL_ARRAY_BUFFER, gVertexBuffer);
    glBufferData(GL_ARRAY_BUFFER,
                 static_cast<GLsizeiptr>(vertices.size() * sizeof(Vertex)),
                 vertices.data(), GL_STATIC_DRAW);

    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, gIndexBuffer);
    glBufferData(GL_ELEMENT_ARRAY_BUFFER,
                 static_cast<GLsizeiptr>(indices.size()
                                         * sizeof(std::uint16_t)),
                 indices.data(), GL_STATIC_DRAW);

    glEnableVertexAttribArray(0);
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex),
                          reinterpret_cast<void*>(offsetof(Vertex, position)));

    glEnableVertexAttribArray(1);
    glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex),
                          reinterpret_cast<void*>(offsetof(Vertex, normal)));

    glBindVertexArray(0);
    gIndexCount = static_cast<GLsizei>(indices.size());
}

Mat4 identityMatrix() {
    Mat4 result{};
    result[0] = 1.0f;
    result[5] = 1.0f;
    result[10] = 1.0f;
    result[15] = 1.0f;
    return result;
}

Mat4 multiply(const Mat4& a, const Mat4& b) {
    Mat4 result{};
    for (int column = 0; column < 4; ++column) {
        for (int row = 0; row < 4; ++row) {
            float value = 0.0f;
            for (int index = 0; index < 4; ++index) {
                value += a[index * 4 + row] * b[column * 4 + index];
            }
            result[column * 4 + row] = value;
        }
    }
    return result;
}

Mat4 perspective(float fieldOfViewRadians, float aspect,
                 float nearPlane, float farPlane) {
    Mat4 result{};
    const float f = 1.0f / std::tan(fieldOfViewRadians * 0.5f);
    result[0] = f / aspect;
    result[5] = f;
    result[10] = (farPlane + nearPlane) / (nearPlane - farPlane);
    result[11] = -1.0f;
    result[14] = (2.0f * farPlane * nearPlane)
                 / (nearPlane - farPlane);
    return result;
}

Mat4 rotationX(float angle) {
    Mat4 result = identityMatrix();
    const float cosine = std::cos(angle);
    const float sine = std::sin(angle);
    result[5] = cosine;
    result[6] = sine;
    result[9] = -sine;
    result[10] = cosine;
    return result;
}

Mat4 rotationY(float angle) {
    Mat4 result = identityMatrix();
    const float cosine = std::cos(angle);
    const float sine = std::sin(angle);
    result[0] = cosine;
    result[2] = -sine;
    result[8] = sine;
    result[10] = cosine;
    return result;
}

Mat4 viewTranslation(float z) {
    Mat4 result = identityMatrix();
    result[14] = z;
    return result;
}

void initializeRenderer() {
    gProgram = createProgram();
    if (gProgram == 0) {
        logError("Renderer initialization stopped: shader program unavailable.");
        return;
    }

    gMvpLocation = glGetUniformLocation(gProgram, "uMvp");
    gModelLocation = glGetUniformLocation(gProgram, "uModel");

    createMesh();

    glEnable(GL_DEPTH_TEST);
    glDepthFunc(GL_LEQUAL);
    glDisable(GL_CULL_FACE);
    glClearColor(0.025f, 0.045f, 0.072f, 1.0f);

    __android_log_print(ANDROID_LOG_INFO, kLogTag,
                        "OpenGL ES renderer initialized.");
}

}  // namespace

extern "C" JNIEXPORT void JNICALL
Java_com_pilgrix_emm_MainActivity_nativeOnSurfaceCreated(
        JNIEnv*, jobject) {
    initializeRenderer();
}

extern "C" JNIEXPORT void JNICALL
Java_com_pilgrix_emm_MainActivity_nativeOnSurfaceChanged(
        JNIEnv*, jobject, jint width, jint height) {
    gWidth = std::max(1, static_cast<int>(width));
    gHeight = std::max(1, static_cast<int>(height));
    glViewport(0, 0, gWidth, gHeight);
}

extern "C" JNIEXPORT void JNICALL
Java_com_pilgrix_emm_MainActivity_nativeOnDrawFrame(
        JNIEnv*, jobject, jfloat elapsedSeconds) {
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

    if (gProgram == 0 || gVertexArray == 0 || gIndexCount == 0) {
        return;
    }

    const float automaticRotation = elapsedSeconds * 0.24f;
    const Mat4 rotation = multiply(
            rotationY(automaticRotation + gTouchYaw),
            rotationX(gTouchPitch));
    const Mat4 modelView = multiply(viewTranslation(-3.4f), rotation);
    const Mat4 projection = perspective(
            0.78539816339f,
            static_cast<float>(gWidth) / static_cast<float>(gHeight),
            0.1f, 100.0f);
    const Mat4 mvp = multiply(projection, modelView);

    glUseProgram(gProgram);
    glUniformMatrix4fv(gModelLocation, 1, GL_FALSE, modelView.data());
    glUniformMatrix4fv(gMvpLocation, 1, GL_FALSE, mvp.data());

    glBindVertexArray(gVertexArray);
    glDrawElements(GL_TRIANGLES, gIndexCount, GL_UNSIGNED_SHORT, nullptr);
    glBindVertexArray(0);
}

extern "C" JNIEXPORT void JNICALL
Java_com_pilgrix_emm_MainActivity_nativeAddTouch(
        JNIEnv*, jobject, jfloat deltaX, jfloat deltaY) {
    gTouchYaw += deltaX * 4.0f;
    gTouchPitch = std::clamp(gTouchPitch + deltaY * 4.0f, -1.35f, 1.35f);
}
