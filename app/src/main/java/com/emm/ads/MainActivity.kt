package com.emm.ads

import android.net.Uri
import android.os.Bundle
import android.view.View
import android.widget.MediaController
import android.widget.VideoView
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView

private val Canvas = Color(0xFFF7F8FC)
private val Ink = Color(0xFF17213D)
private val Muted = Color(0xFF78829A)
private val Brand = Color(0xFF4566E8)
private val BrandSoft = Color(0xFFEDF1FF)
private val Line = Color(0xFFE7EAF2)
private val White = Color.White

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = android.graphics.Color.rgb(247, 248, 252)
        window.navigationBarColor = android.graphics.Color.rgb(247, 248, 252)
        window.decorView.systemUiVisibility =
            View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR

        setContent {
            MaterialTheme(
                colorScheme = lightColorScheme(
                    primary = Brand,
                    secondary = Color(0xFF8797F5),
                    background = Canvas,
                    surface = White,
                    onPrimary = White,
                    onBackground = Ink,
                    onSurface = Ink
                )
            ) {
                EmmAdsApp()
            }
        }
    }
}

private enum class StudioTool(
    val title: String,
    val symbol: String,
    val options: List<String>,
    val initialChoice: String
) {
    VOICEOVER("Voiceover", "◖", listOf("Off", "Female · warm and friendly", "Male · confident", "Natural storyteller"), "Off"),
    MUSIC("Music", "♫", listOf("No music", "Bright and upbeat", "Cinematic", "Soft and elegant", "Modern electronic"), "No music"),
    CAPTIONS("Captions", "Aa", listOf("Off", "Clean subtitles", "Bold animated captions", "Minimal lower thirds"), "Clean subtitles"),
    FORMAT("Format", "▣", listOf("9:16 · Reels / TikTok", "1:1 · Square", "16:9 · YouTube"), "9:16 · Reels / TikTok"),
    STYLE("Style", "✳", listOf("Premium and elegant", "Bright and energetic", "Minimal and clean", "Playful and bold", "Cinematic"), "Premium and elegant")
}

private data class AdConcept(val title: String, val subtitle: String, val prompt: String)

private val starterConcepts = listOf(
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

private data class ChatMessage(val text: String, val fromUser: Boolean)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun EmmAdsApp() {
    val context = LocalContext.current
    var selectedVideo by remember { mutableStateOf<Uri?>(null) }
    var prompt by remember { mutableStateOf("") }
    var selectedConcept by remember { mutableStateOf<String?>(null) }
    var activeTool by remember { mutableStateOf<StudioTool?>(null) }
    val chosenOptions = remember { mutableStateMapOf<StudioTool, String>() }
    val messages = remember {
        mutableStateListOf(
            ChatMessage(
                "Upload a clip, then tell me what kind of ad you have in mind. Mention the audience, mood and the message you want people to remember.",
                false
            )
        )
    }

    val videoPicker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) selectedVideo = uri
    }

    val sendDirection = {
        val cleanPrompt = prompt.trim()
        if (cleanPrompt.isNotEmpty()) {
            messages.add(ChatMessage(cleanPrompt, true))
            messages.add(
                ChatMessage(
                    "Direction added to this demo workspace. Live AI editing and video rendering still need to be connected.",
                    false
                )
            )
            prompt = ""
        }
    }

    Column(modifier = Modifier.fillMaxSize().background(Canvas)) {
        Header()
        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 18.dp)
        ) {
            Spacer(Modifier.height(10.dp))
            SectionHeading("Your creative canvas", "Your footage, transformed into an ad.")
            Spacer(Modifier.height(12.dp))
            VideoWorkspace(
                videoUri = selectedVideo,
                onUpload = { videoPicker.launch("video/*") },
                onClear = { selectedVideo = null }
            )

            if (selectedVideo != null) {
                Spacer(Modifier.height(16.dp))
                SuggestionPanel(
                    selected = selectedConcept,
                    onSelect = { concept ->
                        selectedConcept = concept.title
                        prompt = concept.prompt
                    }
                )
            }

            Spacer(Modifier.height(20.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("Creative tools", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Ink)
                    Text("Fine-tune the feel of your ad", fontSize = 12.sp, color = Muted)
                }
                Text("OPTIONAL", fontSize = 10.sp, color = Muted, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
            }
            Spacer(Modifier.height(10.dp))
            Row(
                modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(9.dp)
            ) {
                StudioTool.values().forEach { tool ->
                    ToolTile(tool, chosenOptions[tool]) { activeTool = tool }
                }
            }

            Spacer(Modifier.height(18.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("Creative direction", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Ink)
                    Text("Work with your AI creative partner", fontSize = 12.sp, color = Muted)
                }
                Surface(color = Color(0xFFEAF7F0), shape = RoundedCornerShape(50)) {
                    Text(
                        "●  STUDIO",
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        color = Color(0xFF25865A),
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 0.7.sp
                    )
                }
            }
            Spacer(Modifier.height(12.dp))
            ChatFeed(messages)
            Spacer(Modifier.height(16.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Ready to make something?", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = Ink)
                Button(
                    onClick = {
                        Toast.makeText(
                            context,
                            "Interface prototype only. Connect the video-rendering service to generate an ad.",
                            Toast.LENGTH_LONG
                        ).show()
                    },
                    enabled = selectedVideo != null,
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Brand,
                        disabledContainerColor = Color(0xFFDDE3F5)
                    ),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 15.dp, vertical = 10.dp)
                ) {
                    Text("Generate ad  ↗", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
            Spacer(Modifier.height(20.dp))
        }

        PromptComposer(
            value = prompt,
            onValueChange = { prompt = it },
            onSend = sendDirection,
            onAttach = { videoPicker.launch("video/*") }
        )
    }

    activeTool?.let { tool ->
        ModalBottomSheet(
            onDismissRequest = { activeTool = null },
            containerColor = White,
            shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
            dragHandle = {
                Box(
                    modifier = Modifier
                        .padding(top = 12.dp, bottom = 8.dp)
                        .width(38.dp)
                        .height(4.dp)
                        .clip(CircleShape)
                        .background(Color(0xFFD9DEEA))
                )
            }
        ) {
            ToolOptionsSheet(
                tool = tool,
                selected = chosenOptions[tool] ?: tool.initialChoice,
                onSelect = { choice ->
                    chosenOptions[tool] = choice
                    activeTool = null
                }
            )
        }
    }
}

@Composable
private fun Header() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(White)
            .border(1.dp, Line)
            .padding(horizontal = 19.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .clip(RoundedCornerShape(13.dp))
                    .background(Brush.linearGradient(listOf(Brand, Color(0xFF8795F7)))),
                contentAlignment = Alignment.Center
            ) {
                Text("E", color = White, fontSize = 22.sp, fontWeight = FontWeight.Black)
            }
            Spacer(Modifier.width(10.dp))
            Column {
                Text("EMM Ads Creator", fontSize = 17.sp, color = Ink, fontWeight = FontWeight.ExtraBold)
                Text("AI AD STUDIO", fontSize = 9.sp, color = Muted, letterSpacing = 1.7.sp, fontWeight = FontWeight.Bold)
            }
        }
        Surface(color = BrandSoft, shape = RoundedCornerShape(50), border = BorderStroke(1.dp, Color(0xFFDDE4FF))) {
            Text(
                "NEW PROJECT",
                color = Brand,
                fontSize = 9.sp,
                letterSpacing = 0.8.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(horizontal = 11.dp, vertical = 8.dp)
            )
        }
    }
}

@Composable
private fun SectionHeading(title: String, detail: String) {
    Column {
        Text(title, fontSize = 20.sp, color = Ink, fontWeight = FontWeight.ExtraBold)
        Spacer(Modifier.height(3.dp))
        Text(detail, fontSize = 12.sp, color = Muted)
    }
}

@Composable
private fun VideoWorkspace(videoUri: Uri?, onUpload: () -> Unit, onClear: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(25.dp),
        colors = CardDefaults.cardColors(containerColor = White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 3.dp, vertical = 3.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("VIDEO PREVIEW", fontSize = 9.sp, color = Muted, fontWeight = FontWeight.Bold, letterSpacing = 1.1.sp)
                    Spacer(Modifier.width(7.dp))
                    Surface(color = Color(0xFFEFF2FA), shape = RoundedCornerShape(50)) {
                        Text("16:9 canvas", fontSize = 9.sp, color = Color(0xFF65708A), modifier = Modifier.padding(horizontal = 7.dp, vertical = 4.dp))
                    }
                }
                Text(
                    if (videoUri == null) "No clip yet" else "CLIP ADDED",
                    color = if (videoUri == null) Muted else Color(0xFF25865A),
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(Modifier.height(8.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(1.48f)
                    .clip(RoundedCornerShape(19.dp))
                    .background(Brush.linearGradient(listOf(Color(0xFFEAF0FF), Color(0xFFDCE5FF), Color(0xFFEDEBFF)))),
                contentAlignment = Alignment.Center
            ) {
                if (videoUri == null) {
                    Box(
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(18.dp)
                            .size(82.dp)
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.28f))
                    )
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(18.dp)) {
                        Surface(color = White, shape = RoundedCornerShape(20.dp), shadowElevation = 5.dp) {
                            Box(Modifier.size(58.dp), contentAlignment = Alignment.Center) {
                                Text("▶", fontSize = 23.sp, color = Brand)
                            }
                        }
                        Spacer(Modifier.height(13.dp))
                        Text(
                            "Your next great ad starts here",
                            color = Color(0xFF26365D),
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            textAlign = TextAlign.Center
                        )
                        Spacer(Modifier.height(5.dp))
                        Text("Bring your footage into the studio", color = Color(0xFF65749A), fontSize = 11.sp, textAlign = TextAlign.Center)
                        Spacer(Modifier.height(13.dp))
                        Button(
                            onClick = onUpload,
                            shape = RoundedCornerShape(13.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Brand),
                            contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 17.dp, vertical = 10.dp)
                        ) {
                            Text("+  Upload a clip", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                } else {
                    androidx.compose.runtime.key(videoUri) {
                        AndroidView(
                            modifier = Modifier.fillMaxSize(),
                            factory = { viewContext ->
                                VideoView(viewContext).apply {
                                    val controller = MediaController(viewContext)
                                    controller.setAnchorView(this)
                                    setMediaController(controller)
                                    setVideoURI(videoUri)
                                    setOnPreparedListener { player ->
                                        player.isLooping = true
                                        start()
                                    }
                                }
                            }
                        )
                    }
                    Surface(
                        modifier = Modifier.align(Alignment.TopEnd).padding(9.dp).clickable(onClick = onClear),
                        color = Color.Black.copy(alpha = 0.55f),
                        shape = RoundedCornerShape(50)
                    ) {
                        Text("Remove  ×", color = White, fontSize = 10.sp, modifier = Modifier.padding(horizontal = 10.dp, vertical = 7.dp))
                    }
                }
            }
            Spacer(Modifier.height(10.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    if (videoUri == null) "Upload a detailed product or service clip" else "Your source footage is ready",
                    color = Muted,
                    fontSize = 10.sp
                )
                if (videoUri != null) {
                    Text("Replace", color = Brand, fontSize = 11.sp, fontWeight = FontWeight.Bold, modifier = Modifier.clickable(onClick = onUpload).padding(3.dp))
                }
            }
        }
    }
}

@Composable
private fun SuggestionPanel(selected: String?, onSelect: (AdConcept) -> Unit) {
    Column {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                Text("Starter ad directions", fontSize = 15.sp, color = Ink, fontWeight = FontWeight.Bold)
                Text("Choose an approach or write your own below", fontSize = 11.sp, color = Muted)
            }
            Surface(color = BrandSoft, shape = RoundedCornerShape(50)) {
                Text("IDEAS", color = Brand, fontSize = 9.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 9.dp, vertical = 6.dp))
            }
        }
        Spacer(Modifier.height(10.dp))
        Row(
            modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(9.dp)
        ) {
            starterConcepts.forEach { concept ->
                val isSelected = selected == concept.title
                Surface(
                    modifier = Modifier.width(205.dp).clickable(onClick = { onSelect(concept) }),
                    color = if (isSelected) Color(0xFFF0F3FF) else White,
                    shape = RoundedCornerShape(18.dp),
                    border = BorderStroke(1.dp, if (isSelected) Brand else Line)
                ) {
                    Column(Modifier.padding(13.dp)) {
                        Text(concept.title, fontSize = 12.sp, color = Ink, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.height(4.dp))
                        Text(concept.subtitle, fontSize = 10.sp, color = Muted)
                        Spacer(Modifier.height(9.dp))
                        Text(
                            if (isSelected) "SELECTED ✓" else "USE THIS DIRECTION  →",
                            color = Brand,
                            fontSize = 8.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 0.5.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ToolTile(tool: StudioTool, chosen: String?, onClick: () -> Unit) {
    Surface(
        modifier = Modifier.width(91.dp).clickable(onClick = onClick),
        color = White,
        shape = RoundedCornerShape(17.dp),
        border = BorderStroke(1.dp, if (chosen != null) Color(0xFFBFCBFF) else Line),
        shadowElevation = 0.dp
    ) {
        Column(modifier = Modifier.padding(horizontal = 9.dp, vertical = 11.dp), horizontalAlignment = Alignment.Start) {
            Surface(color = BrandSoft, shape = RoundedCornerShape(11.dp)) {
                Box(Modifier.size(31.dp), contentAlignment = Alignment.Center) {
                    Text(tool.symbol, color = Brand, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                }
            }
            Spacer(Modifier.height(8.dp))
            Text(tool.title, fontSize = 11.sp, color = Ink, fontWeight = FontWeight.Bold)
            Text(chosen ?: tool.initialChoice, fontSize = 9.sp, color = Muted, maxLines = 1)
        }
    }
}

@Composable
private fun ChatFeed(messages: List<ChatMessage>) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        messages.takeLast(5).forEach { message ->
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = if (message.fromUser) 42.dp else 0.dp, end = if (message.fromUser) 0.dp else 28.dp),
                horizontalAlignment = if (message.fromUser) Alignment.End else Alignment.Start
            ) {
                Text(
                    if (message.fromUser) "YOU" else "EMM CREATIVE ASSISTANT",
                    color = Muted,
                    fontSize = 8.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 0.8.sp,
                    modifier = Modifier.padding(horizontal = 5.dp, vertical = 3.dp)
                )
                Surface(
                    color = if (message.fromUser) Brand else White,
                    shape = RoundedCornerShape(
                        topStart = 17.dp,
                        topEnd = 17.dp,
                        bottomEnd = if (message.fromUser) 5.dp else 17.dp,
                        bottomStart = if (message.fromUser) 17.dp else 5.dp
                    ),
                    border = if (message.fromUser) null else BorderStroke(1.dp, Line)
                ) {
                    Text(
                        message.text,
                        color = if (message.fromUser) White else Color(0xFF4E5B76),
                        fontSize = 12.sp,
                        lineHeight = 18.sp,
                        modifier = Modifier.padding(horizontal = 13.dp, vertical = 11.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun PromptComposer(value: String, onValueChange: (String) -> Unit, onSend: () -> Unit, onAttach: () -> Unit) {
    Surface(color = White, shadowElevation = 9.dp, border = BorderStroke(1.dp, Line)) {
        Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 15.dp, vertical = 10.dp)) {
            Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(
                    onClick = onAttach,
                    shape = RoundedCornerShape(15.dp),
                    border = BorderStroke(1.dp, Line),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 12.dp, vertical = 13.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Brand)
                ) {
                    Text("+", fontSize = 19.sp, fontWeight = FontWeight.Medium)
                }
                TextField(
                    value = value,
                    onValueChange = onValueChange,
                    modifier = Modifier.weight(1f).border(1.dp, Line, RoundedCornerShape(17.dp)),
                    placeholder = { Text("Describe the ad you want...", fontSize = 12.sp, color = Muted) },
                    maxLines = 4,
                    shape = RoundedCornerShape(17.dp),
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = Color(0xFFFAFBFE),
                        unfocusedContainerColor = Color(0xFFFAFBFE),
                        focusedIndicatorColor = Color.Transparent,
                        unfocusedIndicatorColor = Color.Transparent,
                        cursorColor = Brand
                    )
                )
                Button(
                    onClick = onSend,
                    enabled = value.isNotBlank(),
                    modifier = Modifier.size(51.dp),
                    shape = RoundedCornerShape(16.dp),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(0.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Brand, disabledContainerColor = Color(0xFFDDE3F5))
                ) {
                    Text("↑", fontSize = 23.sp, fontWeight = FontWeight.Bold)
                }
            }
            Spacer(Modifier.height(6.dp))
            Text(
                "Your clip stays on this device in this prototype. AI rendering is not connected yet.",
                color = Muted,
                fontSize = 9.sp,
                modifier = Modifier.padding(start = 4.dp)
            )
        }
    }
}

@Composable
private fun ToolOptionsSheet(tool: StudioTool, selected: String, onSelect: (String) -> Unit) {
    Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 22.dp).padding(bottom = 30.dp)) {
        Text(tool.title, fontSize = 22.sp, color = Ink, fontWeight = FontWeight.ExtraBold)
        Spacer(Modifier.height(4.dp))
        Text(
            when (tool) {
                StudioTool.VOICEOVER -> "Choose the voice that brings your message to life."
                StudioTool.MUSIC -> "Set the mood for your advertisement."
                StudioTool.CAPTIONS -> "Choose how spoken words appear on screen."
                StudioTool.FORMAT -> "Pick where your finished ad will be shown."
                StudioTool.STYLE -> "Choose the visual personality of your ad."
            },
            fontSize = 12.sp,
            color = Muted
        )
        Spacer(Modifier.height(17.dp))
        tool.options.forEachIndexed { index, option ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .clickable(onClick = { onSelect(option) })
                    .padding(horizontal = 4.dp, vertical = 9.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(Modifier.weight(1f)) {
                    Text(option, fontSize = 13.sp, color = Ink, fontWeight = if (option == selected) FontWeight.Bold else FontWeight.Medium)
                    if (index == 0 && tool == StudioTool.VOICEOVER) {
                        Text("Keep the original clip audio", fontSize = 10.sp, color = Muted)
                    }
                }
                RadioButton(selected = option == selected, onClick = { onSelect(option) })
            }
            if (index < tool.options.lastIndex) HorizontalDivider(color = Line)
        }
    }
}
