📺 DeckoViz TV App

This is a React Native TV application designed to display audio-visual content on an Android TV emulator. It pairs with a mobile device to control and queue image/audio collections for immersive playback.

🚀 Getting Started

    Set Up Android TV Emulator

    Open Android Studio.

    Create or launch an Android TV emulator.

    Run the TV App

    npx react-native run-android

📱 Mobile Pairing Flow

Scan QR Code

Use your mobile app to scan the QR code displayed on the TV.

This pairs your mobile device with the TV app.

Select a Collection

From the mobile device, choose a collection.

Mark it as the Current Collection.

Add to Queue

Tap Set to Queue on the mobile app to send the selected collection to the TV queue.

Start the Queue

Press Start Queue from the mobile.

The TV app will:

Play audio.

Show images in sequence.

Automatically remove items from the queue after playing.

🧠 Features

✅ Remote handling using useTVEventHandler (TV remote support).

✅ Auto-exhausts queue after content is played.

✅ QR-based device pairing.

✅ Real-time control from mobile to TV.

✅ Audio + Image content synchronization.

✅ Queue state persists and updates seamlessly.

🔄 WebSocket Integration

A global WebSocket is planned to be implemented using React Context.

This WebSocket will:

Broadcast state updates from TV to mobile.

Be integrated inside the existing queueLessThan5() function.

Ensure real-time feedback (e.g., notifying mobile when fewer than 5 items are left in queue).

🛠️ To-Do

Create and implement WebSocketContext globally.

Hook into queue status inside queueLessThan5().

Add visual feedback on TV when queue is empty.

Refactor remote control handlers for extensibility.

🧑‍💻 Developer Notes

Works only on Android TV emulator or physical Android TV.

Ensure that both mobile and TV emulator are on the same network (if real-time sync is needed).

Audio and image content must be formatted according to the spec defined in the mobile app.
