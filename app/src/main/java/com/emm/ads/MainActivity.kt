package com.emm.ads

import android.app.Activity
import android.app.AlertDialog
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

    private data class StudioSetting(
        val title: String,
        val options: List<String>,
        val defaultValue: String,
        val description: String
    )

    private val settings = listOf(
        StudioSetting(
            "Placement",
            listOf(
                "Instagram Reels · 9:16",
                "TikTok · 9:16",
                "YouTube Shorts · 9:16",
                "Instagram Feed · 1:1",
                "YouTube · 16:9"
            ),
            "Instagram Reels · 9:16",
            "Choose where your advertisement will be published."
        ),
        StudioSetting(
            "Duration",
            listOf("15 seconds", "30 seconds", "60 seconds"),
            "15 seconds",
            "Choose the target length for your advertisement."
        ),
        StudioSetting(
            "Visual style",
            listOf(
                "Clean and modern",
                "Premium and elegant",
                "Bright and energetic",
                "Playful and bold",
                "Cinematic"
            ),
            "Clean and modern",
            "Choose the visual personality of your advertisement."
        ),
        StudioSetting(
            "Captions",
            listOf("Clean subtitles", "Bold animated captions", "No captions"),
            "Clean subtitles",
            "Choose how spoken words should appear on screen."
        )
    )

    private val chosenSettings = mutableMapOf<String, String>()

    private lateinit var videoFrame: FrameLayout
    private lateinit var videoPlaceholderGroup: LinearLayout
    private lateinit var clipStatus: TextView
    private lateinit var sourceHint: TextView
    private lateinit var settingsContainer: LinearLayout
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
        setupSettings()

        findViewById<Button>(R.id.uploadClipButton).setOnClickListener {
            openVideoPicker()
        }
    }

    private fun bindViews() {
        videoFrame = findViewById(R.id.videoFrame)
        videoPlaceholderGroup = findViewById(R.id.videoPlaceholderGroup)
        clipStatus = findViewById(R.id.clipStatus)
        sourceHint = findViewById(R.id.sourceHint)
        settingsContainer = findViewById(R.id.settingsContainer)
        productNameInput = findViewById(R.id.productNameInput)
        productDescriptionInput = findViewById(R.id.productDescriptionInput)
        audienceInput = findViewById(R.id.audienceInput)
        adGoalInput = findViewById(R.id.adGoalInput)
    }

    private fun setupSettings() {
        settingsContainer.removeAllViews()

        settings.forEachIndexed { index, setting ->
            val params = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dp(68)
            ).apply {
                if (index > 0) topMargin = dp(8)
            }
            settingsContainer.addView(createSettingRow(setting), params)
        }
    }

    private fun createSettingRow(setting: StudioSetting): View {
        val row = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(14), dp(10), dp(14), dp(10))
            background = rounded(
                0xFFFFFFFF.toInt(),
                12f,
                0xFFE4E8F0.toInt()
            )
            isClickable = true
            isFocusable = true
            contentDescription = "${setting.title}, ${chosenSettings[setting.title] ?: setting.defaultValue}"
        }

        val textColumn = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_VERTICAL
        }

        val title = TextView(this).apply {
            text = setting.title
            textSize = 11f
            setTextColor(0xFF78839A.toInt())
            typeface = Typeface.DEFAULT_BOLD
            maxLines = 1
        }
        textColumn.addView(title)

        val selectedValue = TextView(this).apply {
            text = chosenSettings[setting.title] ?: setting.defaultValue
            textSize = 13f
            setTextColor(0xFF17213D.toInt())
            typeface = Typeface.DEFAULT_BOLD
            maxLines = 1
            ellipsize = android.text.TextUtils.TruncateAt.END
            setPadding(0, dp(3), 0, 0)
        }
        textColumn.addView(selectedValue)

        row.addView(
            textColumn,
            LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
        )

        val arrow = TextView(this).apply {
            text = "›"
            textSize = 25f
            setTextColor(0xFF9AA4B7.toInt())
            gravity = Gravity.CENTER
        }
        row.addView(
            arrow,
            LinearLayout.LayoutParams(dp(24), ViewGroup.LayoutParams.MATCH_PARENT)
        )

        row.setOnClickListener {
            showSettingOptions(setting)
        }

        return row
    }

    private fun showSettingOptions(setting: StudioSetting) {
        val currentValue = chosenSettings[setting.title] ?: setting.defaultValue
        val selectedIndex = setting.options.indexOf(currentValue).coerceAtLeast(0)

        val dialog = AlertDialog.Builder(this)
            .setTitle(setting.title)
            .setMessage(setting.description)
            .setSingleChoiceItems(setting.options.toTypedArray(), selectedIndex) { dialogInterface, which ->
                chosenSettings[setting.title] = setting.options[which]
                setupSettings()
                dialogInterface.dismiss()
            }
            .setNegativeButton("Cancel", null)
            .create()

        dialog.setOnShowListener {
            dialog.getButton(AlertDialog.BUTTON_NEGATIVE)
                ?.setTextColor(0xFF4566E8.toInt())
        }
        dialog.show()
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
