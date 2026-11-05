package com.emm.ads

import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.os.Bundle
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
        val symbol: String,
        val options: List<String>,
        val defaultValue: String,
        val description: String
    )

    private val settings = listOf(
        StudioSetting(
            "Platform",
            "▣",
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
            "Ad length",
            "◷",
            listOf("15 seconds", "30 seconds", "60 seconds"),
            "15 seconds",
            "Choose the target length for your advertisement."
        ),
        StudioSetting(
            "Visual style",
            "✦",
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
            "Aa",
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
    private lateinit var generateButton: Button

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

        generateButton.setOnClickListener {
            buildAdBrief()
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
        generateButton = findViewById(R.id.generateButton)
    }

    private fun setupSettings() {
        settingsContainer.removeAllViews()

        settings.chunked(2).forEach { rowSettings ->
            val row = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                weightSum = 2f
            }

            rowSettings.forEachIndexed { index, setting ->
                val tile = createSettingTile(setting)
                val params = LinearLayout.LayoutParams(
                    0,
                    dp(104),
                    1f
                ).apply {
                    if (index == 0) marginEnd = dp(6) else marginStart = dp(6)
                }
                row.addView(tile, params)
            }

            if (rowSettings.size == 1) {
                row.addView(
                    View(this),
                    LinearLayout.LayoutParams(0, dp(104), 1f).apply {
                        marginStart = dp(6)
                    }
                )
            }

            val rowParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                if (settingsContainer.childCount > 0) topMargin = dp(10)
            }
            settingsContainer.addView(row, rowParams)
        }
    }

    private fun createSettingTile(setting: StudioSetting): View {
        val tile = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(12), dp(11), dp(12), dp(11))
            background = rounded(Color.rgb(248, 249, 253), 15f, 0xFFE7EAF2.toInt())
            isClickable = true
            isFocusable = true
            contentDescription = setting.title
        }

        val topRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }

        val icon = TextView(this).apply {
            text = setting.symbol
            textSize = 15f
            gravity = Gravity.CENTER
            setTextColor(0xFF4566E8.toInt())
            typeface = Typeface.DEFAULT_BOLD
            background = rounded(0xFFEEF1FF.toInt(), 10f)
            setPadding(dp(7), dp(5), dp(7), dp(5))
        }
        topRow.addView(icon, LinearLayout.LayoutParams(dp(30), dp(30)))

        val title = TextView(this).apply {
            text = setting.title
            textSize = 11f
            setTextColor(0xFF58647E.toInt())
            typeface = Typeface.DEFAULT_BOLD
            maxLines = 1
        }
        topRow.addView(
            title,
            LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f).apply {
                marginStart = dp(8)
            }
        )

        val arrow = TextView(this).apply {
            text = "⌄"
            textSize = 16f
            setTextColor(0xFF98A1B3.toInt())
        }
        topRow.addView(arrow)
        tile.addView(topRow)

        val selectedValue = TextView(this).apply {
            text = chosenSettings[setting.title] ?: setting.defaultValue
            textSize = 10f
            setTextColor(0xFF17213D.toInt())
            typeface = Typeface.DEFAULT_BOLD
            maxLines = 2
            setPadding(0, dp(8), 0, 0)
        }
        tile.addView(selectedValue)

        tile.setOnClickListener {
            showSettingOptions(setting)
        }

        return tile
    }

    private fun showSettingOptions(setting: StudioSetting) {
        val currentValue = chosenSettings[setting.title] ?: setting.defaultValue
        val selectedIndex = setting.options.indexOf(currentValue).coerceAtLeast(0)

        AlertDialog.Builder(this)
            .setTitle(setting.title)
            .setMessage(setting.description)
            .setSingleChoiceItems(setting.options.toTypedArray(), selectedIndex) { dialog, which ->
                chosenSettings[setting.title] = setting.options[which]
                setupSettings()
                dialog.dismiss()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun openVideoPicker() {
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "video/*"
        }

        try {
            startActivityForResult(intent, VIDEO_PICKER_REQUEST)
        } catch (_: Exception) {
            Toast.makeText(
                this,
                "No video picker is available on this device.",
                Toast.LENGTH_LONG
            ).show()
        }
    }

    @Deprecated("Uses the Android activity result callback for broad device compatibility.")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)

        if (requestCode == VIDEO_PICKER_REQUEST && resultCode == RESULT_OK) {
            val uri = data?.data ?: return

            try {
                contentResolver.takePersistableUriPermission(
                    uri,
                    Intent.FLAG_GRANT_READ_URI_PERMISSION
                )
            } catch (_: SecurityException) {
                // Some document providers grant access only for the current session.
            }

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
            text = "Remove video  ×"
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

        clipStatus.text = "VIDEO ADDED"
        clipStatus.setTextColor(0xFF25865A.toInt())
        clipStatus.background = rounded(0xFFEAF7F0.toInt(), 14f)
        sourceHint.text = "Your source footage is ready to use."
        generateButton.isEnabled = true
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

        clipStatus.text = "NOT ADDED"
        clipStatus.setTextColor(0xFF8490A8.toInt())
        clipStatus.background = rounded(0xFFF0F2F7.toInt(), 14f)
        sourceHint.text = "MP4 and other Android-supported video formats"
        generateButton.isEnabled = false
    }

    private fun buildAdBrief() {
        val productName = productNameInput.text?.toString()?.trim().orEmpty()
        val description = productDescriptionInput.text?.toString()?.trim().orEmpty()

        if (selectedVideo == null) {
            Toast.makeText(this, "Choose a source video first.", Toast.LENGTH_SHORT).show()
            return
        }

        if (productName.isBlank() || description.isBlank()) {
            Toast.makeText(
                this,
                "Add the product name and its main benefit to continue.",
                Toast.LENGTH_LONG
            ).show()
            return
        }

        val audience = audienceInput.text?.toString()?.trim().orEmpty()
            .ifBlank { "Not specified" }
        val goal = adGoalInput.text?.toString()?.trim().orEmpty()
            .ifBlank { "Introduce the product or service" }

        val summary = buildString {
            append("Product: ").append(productName).append("\n\n")
            append("Description: ").append(description).append("\n\n")
            append("Audience: ").append(audience).append("\n\n")
            append("Goal: ").append(goal).append("\n\n")
            settings.forEach { setting ->
                append(setting.title).append(": ")
                    .append(chosenSettings[setting.title] ?: setting.defaultValue)
                    .append("\n")
            }
            append("\nYour brief is complete. Live AI planning and video rendering are not connected in this prototype yet.")
        }

        AlertDialog.Builder(this)
            .setTitle("Your ad brief")
            .setMessage(summary)
            .setPositiveButton("Done", null)
            .show()
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
