# Hiring Centre Ledger — Build & APK Generation Instructions

## Prerequisites

1. **Node.js** v18+ installed
2. **npm** or **yarn**
3. **Java JDK** 17+ (for Android builds)
4. **Android SDK** (via Android Studio or standalone)
5. **Expo CLI** (`npx expo`)

---

## Quick Start (Development)

```bash
# Navigate to project
cd hiring-centre-ledger

# Install dependencies
npm install

# Start Expo dev server
npx expo start

# Run on Android device/emulator
npx expo start --android
```

---

## Generate APK (Production)

### Option 1: Local Build (requires Android SDK)

```bash
# 1. Prebuild the native project
npx expo prebuild --platform android --clean

# 2. Navigate to android directory
cd android

# 3. Build release APK
./gradlew assembleRelease

# 4. APK is located at:
# android/app/build/outputs/apk/release/app-release.apk
```

### Option 2: EAS Build (Cloud — recommended)

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login to Expo account
eas login

# 3. Configure EAS
eas build:configure

# 4. Build APK
eas build --platform android --profile preview

# 5. Download APK from the link provided
```

### EAS Build Configuration

Add this to `eas.json`:

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

---

## Project Structure

```
hiring-centre-ledger/
├── App.tsx                     # Root component
├── app.json                    # Expo configuration
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── src/
│   ├── constants/              # Theme, work types, config
│   ├── database/               # SQLite operations (8 files)
│   ├── stores/                 # Zustand state (5 stores)
│   ├── navigation/             # React Navigation setup
│   ├── screens/                # 10 screens
│   ├── components/             # Reusable components
│   │   └── ui/                 # Base UI components
│   ├── hooks/                  # Custom hooks
│   ├── types/                  # TypeScript interfaces
│   └── utils/                  # Formatters, validators, export
```

---

## Key Features

- **100% Offline** — No internet required
- **SQLite Database** — All data stored locally
- **Auto-save** — Every operation saved immediately
- **Audit Logs** — Full change history
- **Soft Delete** — Archive only, no data loss
- **Excel Export** — 4 professional report formats
- **Backup/Restore** — SQLite + JSON backup
- **Dark Mode** — Full dark theme support
- **Fast Data Entry** — Date defaults to today, auto-calculate amounts

---

## Database

- SQLite via `expo-sqlite`
- WAL mode for performance
- Foreign keys enforced
- Schema versioning for future migrations
- Indexes on all frequently queried columns

---

## Testing Checklist

- [ ] Create farmer → verify appears in list
- [ ] Add work entry → verify amount calculates correctly
- [ ] Add deposit → verify balance updates
- [ ] Check farmer profile timeline → verify running balance
- [ ] Export farmer ledger to Excel → verify file opens correctly
- [ ] Export outstanding report → verify totals
- [ ] Export database backup → verify file saves
- [ ] Import database backup → verify data restored
- [ ] Toggle dark mode → verify all screens
- [ ] Search → verify results across all entities
- [ ] Archive farmer → verify soft delete (hidden, not deleted)
