package com.emm.ads

import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import android.provider.OpenableColumns
import android.text.Editable
import android.text.TextWatcher
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.MediaController
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import android.widget.VideoView

class MainActivity : Activity() {

    private lateinit var videoFrame: FrameLayout
    private lateinit var videoPlaceholderGroup: LinearLayout
    private lateinit var clipStatus: TextView
    private lateinit var sourceHint: TextView
    private lateinit var contentScroll: ScrollView
    private lateinit var productNameInput: EditText
    private lateinit var productDescriptionInput: EditText
    private lateinit var audienceInput: EditText
    private lateinit var adGoalInput: EditText
    private lateinit var benefitCount: TextView
    private lateinit var videoSection: View
    private lateinit var videoModeButton: View
    private lateinit var ideaModeButton: View

    private var selectedVideo: Uri? = null
    private var videoView: VideoView? = null
    private var isVideoMode = true

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        window.statusBarColor = Color.rgb(9, 11, 12)
        window.navigationBarColor = Color.rgb(9, 11, 12)
        window.decorView.systemUiVisibility = 0
        window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE)

        setContentView(R.layout.activity_main)
        bindViews()
        setupInteractions()
        setCreationMode(useVideo = true)
    }

    private fun bindViews() {
        contentScroll = findViewById(R.id.contentScroll)
        videoFrame = findViewById(R.id.videoFrame)
        videoFrame.clipToOutline = true
        videoPlaceholderGroup = findViewById(R.id.videoPlaceholderGroup)
        clipStatus = findViewById(R.id.clipStatus)
        sourceHint = findViewById(R.id.sourceHint)
        productNameInput = findViewById(R.id.productNameInput)
        productDescriptionInput = findViewById(R.id.productDescriptionInput)
        audienceInput = findViewById(R.id.audienceInput)
        adGoalInput = findViewById(R.id.adGoalInput)
        benefitCount = findViewById(R.id.benefitCount)
        videoSection = findViewById(R.id.videoSection)
        videoModeButton = findViewById(R.id.videoModeButton)
        ideaModeButton = findViewById(R.id.ideaModeButton)
    }

    private fun setupInteractions() {
        videoModeButton.setOnClickListener {
            setCreationMode(useVideo = true)
            if (selectedVideo == null) openVideoPicker()
        }

        ideaModeButton.setOnClickListener {
            setCreationMode(useVideo = false)
        }

        findViewById<TextView>(R.id.uploadClipButton).setOnClickListener {
            openVideoPicker()
        }

        findViewById<TextView>(R.id.newAdButton).setOnClickListener {
            resetDraft()
        }

        findViewById<TextView>(R.id.reviewBriefButton).setOnClickListener {
            reviewAdBrief()
        }

        productDescriptionInput.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) = Unit

            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                benefitCount.text = "\${s?.length ?: 0} / 500"
            }

            override fun afterTextChanged(s: Editable?) = Unit
        })
    }

    private fun setCreationMode(useVideo: Boolean) {
        isVideoMode = useVideo
        videoSection.visibility = if (useVideo) View.VISIBLE else View.GONE
        videoModeButton.setBackgroundResource(
            if (useVideo) R.drawable.emm_dark_choice_active else R.drawable.emm_dark_choice
        )
        ideaModeButton.setBackgroundResource(
            if (useVideo) R.drawable.emm_dark_choice else R.drawable.emm_dark_choice_active
        )
    }

    private fun resetDraft() {
        productNameInput.text?.clear()
        productDescriptionInput.text?.clear()
        audienceInput.text?.clear()
        adGoalInput.text?.clear()
        clearVideo()
        setCreationMode(useVideo = true)
        contentScroll.smoothScrollTo(0, 0)
        Toast.makeText(this, "New ad started.", Toast.LENGTH_SHORT).show()
    }

    private fun openVideoPicker() {
        val pickerIntent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            Intent(MediaStore.ACTION_PICK_IMAGES).apply {
                type = "video/*"
            }
        } else {
            Intent(Intent.ACTION_GET_CONTENT).apply {
                addCategory(Intent.CATEGORY_OPENABLE)
                type = "video/*"
            }
        }

        try {
            startActivityForResult(pickerIntent, VIDEO_PICKER_REQUEST)
        } catch (_: Exception) {
            Toast.makeText(
                this,
                "The video picker is not available on this device.",
                Toast.LENGTH_LONG
            ).show()
        }
    }

    @Deprecated("Uses Android's activity result callback for broad device compatibility.")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == VIDEO_PICKER_REQUEST && resultCode == RESULT_OK) {
            data?.data?.let(::showVideo)
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
                    "This clip cannot be previewed on this device.",
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

        val metadata = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(12), dp(8), dp(8), dp(8))
            background = rounded(0xD9101415.toInt(), 13f, 0x44FFFFFF)
        }

        val fileName = TextView(this).apply {
            text = getDisplayName(uri)
            textSize = 10f
            maxLines = 1
            ellipsize = android.text.TextUtils.TruncateAt.MIDDLE
            setTextColor(Color.WHITE)
            typeface = Typeface.DEFAULT_BOLD
        }
        metadata.addView(
            fileName,
            LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
        )

        val removeButton = TextView(this).apply {
            text = "Remove"
            textSize = 9f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(0xFFE7EDE8.toInt())
            setPadding(dp(10), dp(7), dp(10), dp(7))
            background = rounded(0x44515A5B, 30f)
            isClickable = true
            isFocusable = true
            setOnClickListener { clearVideo() }
        }
        metadata.addView(
            removeButton,
            LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply { marginStart = dp(8) }
        )

        videoFrame.addView(
            metadata,
            FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
                Gravity.BOTTOM
            ).apply { setMargins(dp(10), 0, dp(10), dp(10)) }
        )

        clipStatus.text = "VIDEO READY"
        clipStatus.setTextColor(0xFFD9F65A.toInt())
        sourceHint.text = "Clip selected · Preview ready"
    }

    private fun getDisplayName(uri: Uri): String {
        return try {
            contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                val nameColumn = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                if (nameColumn >= 0 && cursor.moveToFirst()) {
                    cursor.getString(nameColumn) ?: "Selected video"
                } else {
                    "Selected video"
                }
            } ?: "Selected video"
        } catch (_: Exception) {
            uri.lastPathSegment ?: "Selected video"
        }
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

        clipStatus.text = "NO VIDEO"
        clipStatus.setTextColor(0xFF9BA3A2.toInt())
        sourceHint.text = "Your video stays on this screen until you continue."
    }

    private fun reviewAdBrief() {
        val productName = productNameInput.text?.toString()?.trim().orEmpty()
        val description = productDescriptionInput.text?.toString()?.trim().orEmpty()

        if (isVideoMode && selectedVideo == null) {
            Toast.makeText(this, "Choose a video first, or switch to Describe an idea.", Toast.LENGTH_LONG).show()
            openVideoPicker()
            return
        }

        if (productName.isBlank()) {
            productNameInput.error = "Enter a product or business name"
            productNameInput.requestFocus()
            scrollTo(R.id.briefSection)
            return
        }

        if (description.isBlank()) {
            productDescriptionInput.error = "Describe what you are promoting"
            productDescriptionInput.requestFocus()
            scrollTo(R.id.briefSection)
            return
        }

        val audience = audienceInput.text?.toString()?.trim().orEmpty()
            .ifBlank { "Not specified" }
        val goal = adGoalInput.text?.toString()?.trim().orEmpty()
            .ifBlank { "Create awareness" }

        val summary = buildString {
            append("Creation type: ")
                .append(if (isVideoMode) "Use a video" else "Describe an idea")
                .append("\n\n")
            append("Product or business: ").append(productName).append("\n\n")
            append("Creative direction: ").append(description).append("\n\n")
            append("Audience: ").append(audience).append("\n\n")
            append("Goal: ").append(goal)
            if (isVideoMode) {
                append("\n\nSource video: ").append(getDisplayName(selectedVideo!!))
            }
            append("\n\nYour brief is ready. AI planning and final video rendering will be connected to this native screen next.")
        }

        AlertDialog.Builder(this)
            .setTitle("Your ad brief")
            .setMessage(summary)
            .setPositiveButton("Done", null)
            .setNegativeButton("Edit", null)
            .show()
    }

    private fun scrollTo(viewId: Int) {
        val target = findViewById<View>(viewId)
        contentScroll.post {
            val targetLocation = IntArray(2)
            val scrollLocation = IntArray(2)
            target.getLocationOnScreen(targetLocation)
            contentScroll.getLocationOnScreen(scrollLocation)
            val targetScroll = contentScroll.scrollY +
                targetLocation[1] - scrollLocation[1] - dp(12)
            contentScroll.smoothScrollTo(0, targetScroll.coerceAtLeast(0))
        }
    }

    private fun rounded(color: Int, radiusDp: Float, strokeColor: Int? = null): GradientDrawable {
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