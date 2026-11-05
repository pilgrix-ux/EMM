package com.emm.ads

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.MediaController
import android.widget.TextView
import android.widget.Toast
import android.widget.VideoView

class MainActivity : Activity() {

    private lateinit var videoFrame: FrameLayout
    private lateinit var videoPlaceholderGroup: LinearLayout
    private lateinit var clipStatus: TextView
    private lateinit var sourceHint: TextView
    private lateinit var productNameInput: EditText
    private lateinit var productDescriptionInput: EditText
    private lateinit var audienceInput: EditText
    private lateinit var adGoalInput: EditText

    private var selectedVideo: Uri? = null
    private var videoView: VideoView? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        window.statusBarColor = Color.WHITE
        window.navigationBarColor = Color.WHITE
        window.decorView.systemUiVisibility =
            View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR

        setContentView(R.layout.activity_main)
        bindViews()

        findViewById<Button>(R.id.uploadClipButton).setOnClickListener {
            openVideoPicker()
        }
    }

    private fun bindViews() {
        videoFrame = findViewById(R.id.videoFrame)
        videoPlaceholderGroup = findViewById(R.id.videoPlaceholderGroup)
        clipStatus = findViewById(R.id.clipStatus)
        sourceHint = findViewById(R.id.sourceHint)
        productNameInput = findViewById(R.id.productNameInput)
        productDescriptionInput = findViewById(R.id.productDescriptionInput)
        audienceInput = findViewById(R.id.audienceInput)
        adGoalInput = findViewById(R.id.adGoalInput)
    }

    private fun openVideoPicker() {
        // Ask Android to open the phone's video gallery first.
        val galleryIntent = Intent(
            Intent.ACTION_PICK,
            MediaStore.Video.Media.EXTERNAL_CONTENT_URI
        ).apply {
            type = "video/*"
        }

        try {
            startActivityForResult(galleryIntent, VIDEO_PICKER_REQUEST)
        } catch (_: ActivityNotFoundException) {
            // Some devices do not expose a separate Gallery app. Use Android's media picker.
            val fallbackIntent = Intent(Intent.ACTION_GET_CONTENT).apply {
                addCategory(Intent.CATEGORY_OPENABLE)
                type = "video/*"
            }

            try {
                startActivityForResult(fallbackIntent, VIDEO_PICKER_REQUEST)
            } catch (_: ActivityNotFoundException) {
                Toast.makeText(
                    this,
                    "No video gallery or media picker is available on this device.",
                    Toast.LENGTH_LONG
                ).show()
            }
        }
    }

    @Deprecated("Uses the Android activity result callback for broad device compatibility.")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)

        if (requestCode == VIDEO_PICKER_REQUEST && resultCode == RESULT_OK) {
            val uri = data?.data ?: return
            showVideo(uri)
        }
    }

    private fun showVideo(uri: Uri) {
        selectedVideo = uri
        videoView?.stopPlayback()
        videoFrame.removeAllViews()

        val player = VideoView(this).apply {
            setVideoURI(uri)
            setMediaController(MediaController(this@MainActivity))
            setOnPreparedListener { mediaPlayer ->
                mediaPlayer.isLooping = true
                start()
            }
            setOnErrorListener { _, _, _ ->
                Toast.makeText(
                    this@MainActivity,
                    "This video could not be previewed on this device.",
                    Toast.LENGTH_LONG
                ).show()
                true
            }
        }
        videoView = player

        videoFrame.addView(
            player,
            FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        )

        val removeButton = TextView(this).apply {
            text = "Remove clip  ×"
            textSize = 10f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Color.WHITE)
            setPadding(dp(11), dp(8), dp(11), dp(8))
            background = rounded(0xCC17213D.toInt(), 18f)
            setOnClickListener { clearVideo() }
        }
        val removeParams = FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT,
            Gravity.TOP or Gravity.END
        ).apply {
            topMargin = dp(10)
            marginEnd = dp(10)
        }
        videoFrame.addView(removeButton, removeParams)

        clipStatus.text = "READY"
        clipStatus.setTextColor(0xFF247A52.toInt())
        clipStatus.background = rounded(0xFFEAF6EF.toInt(), 14f)
        sourceHint.text = "Your source video is selected and ready for the brief."
    }

    private fun clearVideo() {
        videoView?.stopPlayback()
        videoView = null
        selectedVideo = null

        videoFrame.removeAllViews()
        videoFrame.addView(
            videoPlaceholderGroup,
            FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        )

        clipStatus.text = "REQUIRED"
        clipStatus.setTextColor(0xFF78839A.toInt())
        clipStatus.background = rounded(0xFFF0F2F6.toInt(), 14f)
        sourceHint.text = "MP4, MOV and other supported video formats"
    }

    private fun rounded(
        color: Int,
        radiusDp: Float,
        strokeColor: Int? = null
    ): GradientDrawable {
        return GradientDrawable().apply {
            setColor(color)
            cornerRadius = dp(radiusDp.toInt()).toFloat()
            if (strokeColor != null) setStroke(dp(1), strokeColor)
        }
    }

    private fun dp(value: Int): Int =
        (value * resources.displayMetrics.density + 0.5f).toInt()

    companion object {
        private const val VIDEO_PICKER_REQUEST = 4201
    }
}
