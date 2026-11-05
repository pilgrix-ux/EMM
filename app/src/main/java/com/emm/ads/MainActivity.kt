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
import android.view.inputmethod.EditorInfo
import android.widget.Button
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.MediaController
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import android.widget.VideoView
import android.text.Editable
import android.text.TextWatcher

class MainActivity : Activity() {

    private data class StudioTool(
        val title: String,
        val symbol: String,
        val options: List<String>,
        val initialChoice: String,
        val description: String
    )

    private data class AdConcept(
        val title: String,
        val subtitle: String,
        val prompt: String
    )

    private data class ChatMessage(val text: String, val fromUser: Boolean)

    private val tools = listOf(
        StudioTool(
            "Voiceover", "◖",
            listOf("Off", "Female · warm and friendly", "Male · confident", "Natural storyteller"),
            "Off", "Choose the voice that brings your message to life."
        ),
        StudioTool(
            "Music", "♫",
            listOf("No music", "Bright and upbeat", "Cinematic", "Soft and elegant", "Modern electronic"),
            "No music", "Set the mood for your advertisement."
        ),
        StudioTool(
            "Captions", "Aa",
            listOf("Off", "Clean subtitles", "Bold animated captions", "Minimal lower thirds"),
            "Clean subtitles", "Choose how spoken words appear on screen."
        ),
        StudioTool(
            "Format", "▣",
            listOf("9:16 · Reels / TikTok", "1:1 · Square", "16:9 · YouTube"),
            "9:16 · Reels / TikTok", "Pick where your finished ad will be shown."
        ),
        StudioTool(
            "Style", "✳",
            listOf("Premium and elegant", "Bright and energetic", "Minimal and clean", "Playful and bold", "Cinematic"),
            "Premium and elegant", "Choose the visual personality of your ad."
        )
    )

    private val concepts = listOf(
        AdConcept(
            "Product spotlight",
            "Make the product the hero",
            "Create a premium product spotlight: open with the strongest product shot, highlight the main benefit, and finish with a clear call to action."
        ),
        AdConcept(
            "Problem → solution",
            "Show the value clearly",
            "Build a problem-to-solution ad: show the customer's problem, reveal the product as the solution, and finish with the result they can expect."
        ),
        AdConcept(
            "Lifestyle story",
            "Let viewers picture it",
            "Create a lifestyle-led ad: show the product naturally in use, help viewers imagine the result, and close with a memorable line."
        )
    )

    private val chosenOptions = mutableMapOf<String, String>()
    private val messages = mutableListOf(
        ChatMessage(
            "Upload a clip, then tell me what kind of ad you have in mind. Mention the audience, mood and the message you want people to remember.",
            false
        )
    )

    private lateinit var videoFrame: FrameLayout
    private lateinit var videoPlaceholderGroup: LinearLayout
    private lateinit var clipStatus: TextView
    private lateinit var sourceHint: TextView
    private lateinit var suggestionSection: LinearLayout
    private lateinit var conceptContainer: LinearLayout
    private lateinit var toolsContainer: LinearLayout
    private lateinit var chatContainer: LinearLayout
    private lateinit var productNameInput: EditText
    private lateinit var productDescriptionInput: EditText
    private lateinit var audienceInput: EditText
    private lateinit var adGoalInput: EditText
    private lateinit var promptInput: EditText
    private lateinit var sendButton: Button
    private lateinit var generateButton: Button

    private var selectedVideo: Uri? = null
    private var selectedConcept: String? = null
    private var videoView: VideoView? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = Color.rgb(247, 248, 252)
        window.navigationBarColor = Color.rgb(247, 248, 252)
        window.decorView.systemUiVisibility =
            View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR

        setContentView(R.layout.activity_main)
        bindViews()
        setupConcepts()
        setupTools()
        renderChat()

        findViewById<Button>(R.id.uploadClipButton).setOnClickListener { openVideoPicker() }
        findViewById<Button>(R.id.attachButton).setOnClickListener { openVideoPicker() }

        sendButton.setOnClickListener { sendDirection() }
        promptInput.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) = Unit
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                sendButton.isEnabled = !s.isNullOrBlank()
            }
            override fun afterTextChanged(s: Editable?) = Unit
        })
        promptInput.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_SEND) {
                sendDirection()
                true
            } else {
                false
            }
        }

        generateButton.setOnClickListener {
            val productName = productNameInput.text?.toString()?.trim().orEmpty()
            val productDescription = productDescriptionInput.text?.toString()?.trim().orEmpty()

            if (productName.isBlank() || productDescription.isBlank()) {
                Toast.makeText(
                    this,
                    "Add the product name and a short description to complete your ad brief.",
                    Toast.LENGTH_LONG
                ).show()
                return@setOnClickListener
            }

            val audience = audienceInput.text?.toString()?.trim().orEmpty()
                .ifBlank { "Not specified" }
            val goal = adGoalInput.text?.toString()?.trim().orEmpty()
                .ifBlank { "Introduce the product or service" }
            val selectedStyle = chosenOptions["Style"] ?: "Premium and elegant"
            val selectedFormat = chosenOptions["Format"] ?: "9:16 · Reels / TikTok"

            messages.add(
                ChatMessage(
                    "AD BRIEF\nProduct: $productName\nDetails: $productDescription\nAudience: $audience\nGoal: $goal\nStyle: $selectedStyle\nFormat: $selectedFormat",
                    true
                )
            )
            messages.add(
                ChatMessage(
                    "Your brief is ready in this prototype. Live AI planning and video rendering are not connected yet, so no finished ad has been created.",
                    false
                )
            )
            renderChat()

            Toast.makeText(
                this,
                "Brief checked. AI planning is not connected yet.",
                Toast.LENGTH_LONG
            ).show()

            findViewById<ScrollView>(R.id.contentScroll).post {
                findViewById<ScrollView>(R.id.contentScroll).fullScroll(View.FOCUS_DOWN)
            }
        }
    }

    private fun bindViews() {
        videoFrame = findViewById(R.id.videoFrame)
        videoPlaceholderGroup = findViewById(R.id.videoPlaceholderGroup)
        clipStatus = findViewById(R.id.clipStatus)
        sourceHint = findViewById(R.id.sourceHint)
        suggestionSection = findViewById(R.id.suggestionSection)
        conceptContainer = findViewById(R.id.conceptContainer)
        toolsContainer = findViewById(R.id.toolsContainer)
        chatContainer = findViewById(R.id.chatContainer)
        productNameInput = findViewById(R.id.productNameInput)
        productDescriptionInput = findViewById(R.id.productDescriptionInput)
        audienceInput = findViewById(R.id.audienceInput)
        adGoalInput = findViewById(R.id.adGoalInput)
        promptInput = findViewById(R.id.promptInput)
        sendButton = findViewById(R.id.sendButton)
        generateButton = findViewById(R.id.generateButton)
    }

    private fun setupConcepts() {
        conceptContainer.removeAllViews()
        concepts.forEach { concept ->
            val card = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(dp(13), dp(13), dp(13), dp(13))
                background = rounded(Color.WHITE, 18f, 0xFFE7EAF2.toInt())
                isClickable = true
                isFocusable = true
            }

            card.addView(label(concept.title, 12f, 0xFF17213D.toInt(), true))
            val subtitle = label(concept.subtitle, 10f, 0xFF78829A.toInt())
            val subtitleParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = dp(5) }
            card.addView(subtitle, subtitleParams)

            val action = label(
                if (selectedConcept == concept.title) "SELECTED ✓" else "USE THIS DIRECTION  →",
                8f,
                0xFF4566E8.toInt(),
                true
            )
            val actionParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = dp(10) }
            card.addView(action, actionParams)

            card.setOnClickListener {
                selectedConcept = concept.title
                promptInput.setText(concept.prompt)
                setupConcepts()
            }

            val params = LinearLayout.LayoutParams(dp(205), ViewGroup.LayoutParams.WRAP_CONTENT)
            params.marginEnd = dp(9)
            conceptContainer.addView(card, params)
        }
    }

    private fun setupTools() {
        toolsContainer.removeAllViews()
        tools.forEach { tool ->
            val card = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(dp(10), dp(11), dp(10), dp(11))
                background = rounded(Color.WHITE, 17f, 0xFFE7EAF2.toInt())
                isClickable = true
                isFocusable = true
            }

            val symbol = label(tool.symbol, 17f, 0xFF4566E8.toInt(), true).apply {
                gravity = Gravity.CENTER
                background = rounded(0xFFEDF1FF.toInt(), 11f)
                setPadding(dp(8), dp(5), dp(8), dp(5))
            }
            card.addView(symbol, LinearLayout.LayoutParams(dp(32), dp(32)))
            card.addView(label(tool.title, 11f, 0xFF17213D.toInt(), true).apply {
                val p = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                )
                p.topMargin = dp(8)
                layoutParams = p
            })
            val choice = label(chosenOptions[tool.title] ?: tool.initialChoice, 9f, 0xFF78829A.toInt())
            choice.maxLines = 1
            card.addView(choice)
            card.setOnClickListener { showToolOptions(tool) }

            val params = LinearLayout.LayoutParams(dp(100), dp(104))
            params.marginEnd = dp(9)
            toolsContainer.addView(card, params)
        }
    }

    private fun showToolOptions(tool: StudioTool) {
        val current = chosenOptions[tool.title] ?: tool.initialChoice
        val selectedIndex = tool.options.indexOf(current).coerceAtLeast(0)

        AlertDialog.Builder(this)
            .setTitle(tool.title)
            .setMessage(tool.description)
            .setSingleChoiceItems(tool.options.toTypedArray(), selectedIndex) { dialog, which ->
                chosenOptions[tool.title] = tool.options[which]
                setupTools()
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
            Toast.makeText(this, "No file picker is available on this device.", Toast.LENGTH_LONG).show()
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

        val player = VideoView(this)
        videoView = player
        player.setVideoURI(uri)
        player.setMediaController(MediaController(this))
        player.setOnPreparedListener { mediaPlayer ->
            mediaPlayer.isLooping = true
            player.start()
        }
        player.setOnErrorListener { _, _, _ ->
            Toast.makeText(this, "This video could not be previewed on this device.", Toast.LENGTH_LONG).show()
            true
        }
        videoFrame.addView(
            player,
            FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        )

        val removeButton = TextView(this).apply {
            text = "Remove  ×"
            textSize = 10f
            setTextColor(Color.WHITE)
            setPadding(dp(10), dp(7), dp(10), dp(7))
            background = rounded(0x99000000.toInt(), 20f)
            setOnClickListener { clearVideo() }
        }
        val removeParams = FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT,
            Gravity.TOP or Gravity.END
        ).apply {
            topMargin = dp(9)
            marginEnd = dp(9)
        }
        videoFrame.addView(removeButton, removeParams)

        clipStatus.text = "CLIP ADDED"
        clipStatus.setTextColor(0xFF25865A.toInt())
        sourceHint.text = "Your source footage is ready"
        suggestionSection.visibility = View.VISIBLE
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
        clipStatus.text = "NO CLIP YET"
        clipStatus.setTextColor(0xFF78829A.toInt())
        sourceHint.text = "Upload a detailed product or service clip"
        suggestionSection.visibility = View.GONE
        generateButton.isEnabled = false
    }

    private fun sendDirection() {
        val direction = promptInput.text?.toString()?.trim().orEmpty()
        if (direction.isEmpty()) return

        messages.add(ChatMessage(direction, true))
        messages.add(
            ChatMessage(
                "Direction added to this demo workspace. Live AI editing and video rendering still need to be connected.",
                false
            )
        )
        promptInput.setText("")
        renderChat()

        val scroll = findViewById<ScrollView>(R.id.contentScroll)
        scroll.post { scroll.fullScroll(View.FOCUS_DOWN) }
    }

    private fun renderChat() {
        chatContainer.removeAllViews()
        messages.takeLast(5).forEach { message ->
            val messageColumn = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                gravity = if (message.fromUser) Gravity.END else Gravity.START
            }

            val sender = label(
                if (message.fromUser) "YOU" else "EMM CREATIVE ASSISTANT",
                8f,
                0xFF78829A.toInt(),
                true
            )
            sender.setPadding(dp(5), dp(3), dp(5), dp(3))
            messageColumn.addView(sender)

            val bubble = TextView(this).apply {
                text = message.text
                textSize = 12f
                setTextColor(if (message.fromUser) Color.WHITE else 0xFF4E5B76.toInt())
                setPadding(dp(13), dp(11), dp(13), dp(11))
                background = rounded(
                    if (message.fromUser) 0xFF4566E8.toInt() else Color.WHITE,
                    17f,
                    if (message.fromUser) null else 0xFFE7EAF2.toInt()
                )
            }
            val bubbleParams = LinearLayout.LayoutParams(
                if (message.fromUser) dp(280) else dp(300),
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                if (message.fromUser) marginStart = dp(42) else marginEnd = dp(28)
            }
            messageColumn.addView(bubble, bubbleParams)

            val itemParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply { bottomMargin = dp(10) }
            chatContainer.addView(messageColumn, itemParams)
        }
    }

    private fun label(text: String, sizeSp: Float, color: Int, bold: Boolean = false): TextView {
        return TextView(this).apply {
            this.text = text
            textSize = sizeSp
            setTextColor(color)
            if (bold) setTypeface(typeface, Typeface.BOLD)
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
