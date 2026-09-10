---
trigger: manual
---

use react-native-vision-camera as the single native camera foundation for photo, video, and barcode/QR scanning, and use react-native-image-picker only for gallery/media selection. VisionCamera currently supports photo/video capture and QR/barcode scanning, and its current v5 line is active; its recent releases also include recorder limits such as maximum duration/file size.
For gallery selection, react-native-image-picker provides native camera/library selection and supports image/video selection with duration limits; on Android 13+, Android recommends the Photo Picker/appropriate granular media permissions rather than the old broad storage permission model.