const fs = require("fs")
const path = require("path")

// Files that need the old pattern fixed
const filesToFix = [
  "app/(tabs)/profile/index.tsx",
  "app/(tabs)/sessions/GamesNearby.tsx",
  "app/(tabs)/sessions/index.tsx",
  "app/(tabs)/sessions/InviteFriends.tsx",
  "app/auth/forgot-password.tsx",
  "app/auth/login.tsx",
  "app/auth/signup.tsx",
  "components/AddMembersModal.tsx",
  "components/AppleButton.tsx",
  "components/Card.tsx",
  "components/CreateGroupModal.tsx",
  "components/CustomHeader.tsx",
  "components/DuprConnectionModal.tsx",
  "components/GoogleButton.tsx",
  "components/GroupHeader.tsx",
  "components/LocationAutocomplete.tsx",
  "components/LocationInputModal.tsx",
  "components/SessionModal.tsx",
  "components/SimpleLocationAutocomplete.tsx",
  "screens/groupId/index.tsx",
  "screens/sessions/common/ActionButtons.tsx",
  "screens/sessions/common/CheckboxCard.tsx",
  "screens/sessions/common/ExpandableCard.tsx",
  "screens/sessions/common/RadioCard.tsx",
  "screens/sessions/common/SliderCard.tsx",
  "screens/sessions/CreateSession/index.tsx",
  "screens/sessions/PostPlaySession/index.tsx",
  "screens/sessions/PrePlaySession/index.tsx",
]

function fixFile(filePath) {
  try {
    const fullPath = path.join(__dirname, "..", filePath)
    let content = fs.readFileSync(fullPath, "utf8")

    // Fix the old pattern: const colorScheme = useColorScheme(); const colors = Colors[colorScheme ?? "light"]
    content = content.replace(
      /const colorScheme = useColorScheme\(\)\s+const colors = Colors\[colorScheme \?\? "light"\]/g,
      "const colors = useColorScheme()"
    )

    // Fix theme comparisons: colorScheme === "dark"
    content = content.replace(/colorScheme === "dark"/g, "colors.isDark")

    // Fix theme comparisons: colorScheme === "light"
    content = content.replace(/colorScheme === "light"/g, "colors.isLight")

    fs.writeFileSync(fullPath, content)
    console.log(`✅ Fixed: ${filePath}`)
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message)
  }
}

console.log("🔧 Fixing theming issues...\n")

filesToFix.forEach(fixFile)

console.log("\n🎉 Theming fixes complete!")
