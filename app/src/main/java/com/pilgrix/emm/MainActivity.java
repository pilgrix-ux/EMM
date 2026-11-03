package com.pilgrix.emm;

import android.app.Activity;
import android.opengl.GLSurfaceView;
import android.os.Bundle;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.TextView;

public final class MainActivity extends Activity {
    static {
        System.loadLibrary("emm_native");
    }

    private GLSurfaceView glView;
    private float lastTouchX;
    private float lastTouchY;
    private long startNanos;

    private native void nativeOnSurfaceCreated();
    private native void nativeOnSurfaceChanged(int width, int height);
    private native void nativeOnDrawFrame(float elapsedSeconds);
    private native void nativeAddTouch(float deltaX, float deltaY);

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        enterImmersiveMode();

        startNanos = System.nanoTime();

        FrameLayout root = new FrameLayout(this);
        glView = new GLSurfaceView(this);
        glView.setEGLContextClientVersion(3);
        glView.setPreserveEGLContextOnPause(true);
        glView.setRenderer(new GLSurfaceView.Renderer() {
            @Override
            public void onSurfaceCreated(javax.microedition.khronos.opengles.GL10 gl,
                                         javax.microedition.khronos.egl.EGLConfig config) {
                nativeOnSurfaceCreated();
            }

            @Override
            public void onSurfaceChanged(javax.microedition.khronos.opengles.GL10 gl,
                                         int width, int height) {
                nativeOnSurfaceChanged(width, height);
            }

            @Override
            public void onDrawFrame(javax.microedition.khronos.opengles.GL10 gl) {
                float elapsed = (System.nanoTime() - startNanos) / 1_000_000_000.0f;
                nativeOnDrawFrame(elapsed);
            }
        });
        glView.setRenderMode(GLSurfaceView.RENDERMODE_CONTINUOUSLY);
        glView.setFocusable(true);
        glView.setFocusableInTouchMode(true);
        glView.setOnTouchListener(this::handleTouch);
        root.addView(glView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));

        TextView status = new TextView(this);
        status.setText("EMM  /  NATIVE 3D FOUNDATION\\nDrag to rotate  •  Diagnostic geometry, not final game art");
        status.setTextColor(0xFFEAF1F8);
        status.setTextSize(12.0f);
        status.setGravity(Gravity.CENTER);
        status.setPadding(dp(14), dp(9), dp(14), dp(9));
        status.setBackgroundColor(0x990B1420);

        FrameLayout.LayoutParams statusParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT,
                Gravity.TOP | Gravity.CENTER_HORIZONTAL);
        statusParams.topMargin = dp(14);
        root.addView(status, statusParams);

        setContentView(root);
    }

    private boolean handleTouch(View view, MotionEvent event) {
        switch (event.getActionMasked()) {
            case MotionEvent.ACTION_DOWN:
                lastTouchX = event.getX();
                lastTouchY = event.getY();
                return true;

            case MotionEvent.ACTION_MOVE:
                float width = Math.max(1.0f, view.getWidth());
                float height = Math.max(1.0f, view.getHeight());
                float dx = (event.getX() - lastTouchX) / width;
                float dy = (event.getY() - lastTouchY) / height;
                lastTouchX = event.getX();
                lastTouchY = event.getY();
                glView.queueEvent(() -> nativeAddTouch(dx, dy));
                return true;

            case MotionEvent.ACTION_UP:
            case MotionEvent.ACTION_CANCEL:
                return true;

            default:
                return true;
        }
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private void enterImmersiveMode() {
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        | View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (glView != null) {
            glView.onResume();
        }
    }

    @Override
    protected void onPause() {
        if (glView != null) {
            glView.onPause();
        }
        super.onPause();
    }
}
