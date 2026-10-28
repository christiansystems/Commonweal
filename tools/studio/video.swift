// Makes a post video for one soundtrack track: a still frame from social.js, the track's audio, and a gold
// progress bar that fills as the song plays. Uses only macOS's own AVFoundation, so nothing to install.
//
//     swift tools/studio/video.swift <frame.png> <audio.mp3> <out.mp4> <barX> <barY> <barW> <barH>
//
// The bar box is in the frame's pixels, measured from the top left (see BAR in social.js). It grows in
// 4-pixel steps so it stays on the pixel-art grid.
import AVFoundation
import CoreGraphics
import Foundation
import ImageIO

let a = CommandLine.arguments
guard a.count == 8, let bx = Int(a[4]), let by = Int(a[5]), let bw = Int(a[6]), let bh = Int(a[7]) else {
    print("usage: video.swift frame.png audio.mp3 out.mp4 barX barY barW barH"); exit(2)
}
let frameURL = URL(fileURLWithPath: a[1]), audioURL = URL(fileURLWithPath: a[2]), outURL = URL(fileURLWithPath: a[3])
guard let src = CGImageSourceCreateWithURL(frameURL as CFURL, nil), let still = CGImageSourceCreateImageAtIndex(src, 0, nil) else {
    print("can't read \(a[1])"); exit(1)
}
let W = still.width, H = still.height, fps: Int32 = 30, unit = 4
let gold = CGColor(red: 0xf2 / 255.0, green: 0xb3 / 255.0, blue: 0x3d / 255.0, alpha: 1)
let wine = CGColor(red: 0x4a / 255.0, green: 0x0a / 255.0, blue: 0x0f / 255.0, alpha: 1)

let asset = AVURLAsset(url: audioURL)
let sem = DispatchSemaphore(value: 0)
var audioTrack: AVAssetTrack?
var duration = CMTime.zero
Task {
    audioTrack = try? await asset.loadTracks(withMediaType: .audio).first
    duration = (try? await asset.load(.duration)) ?? .zero
    sem.signal()
}
sem.wait()
guard let track = audioTrack, duration.seconds > 0 else { print("can't read audio \(a[2])"); exit(1) }

try? FileManager.default.removeItem(at: outURL)
let writer = try! AVAssetWriter(outputURL: outURL, fileType: .mp4)
let vIn = AVAssetWriterInput(mediaType: .video, outputSettings: [
    AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: W, AVVideoHeightKey: H,
    AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: 4_000_000, AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel],
])
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: vIn, sourcePixelBufferAttributes: [
    kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA, kCVPixelBufferWidthKey as String: W, kCVPixelBufferHeightKey as String: H,
])
let aIn = AVAssetWriterInput(mediaType: .audio, outputSettings: [
    AVFormatIDKey: kAudioFormatMPEG4AAC, AVSampleRateKey: 44100, AVNumberOfChannelsKey: 2, AVEncoderBitRateKey: 256_000,
])
writer.add(vIn); writer.add(aIn)
let reader = try! AVAssetReader(asset: asset)
let aOut = AVAssetReaderTrackOutput(track: track, outputSettings: [AVFormatIDKey: kAudioFormatLinearPCM])
reader.add(aOut)
reader.startReading(); writer.startWriting(); writer.startSession(atSourceTime: .zero)

// one frame for each step of the bar; repeated frames reuse the same buffer
func frame(filled: Int) -> CVPixelBuffer {
    var pb: CVPixelBuffer?
    CVPixelBufferPoolCreatePixelBuffer(nil, adaptor.pixelBufferPool!, &pb)
    let buf = pb!
    CVPixelBufferLockBaseAddress(buf, [])
    let ctx = CGContext(data: CVPixelBufferGetBaseAddress(buf), width: W, height: H, bitsPerComponent: 8,
                        bytesPerRow: CVPixelBufferGetBytesPerRow(buf), space: CGColorSpaceCreateDeviceRGB(),
                        bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue)!
    ctx.interpolationQuality = .none
    ctx.draw(still, in: CGRect(x: 0, y: 0, width: W, height: H))
    let y = H - by - bh
    ctx.setFillColor(wine); ctx.fill(CGRect(x: bx, y: y, width: bw, height: bh))
    ctx.setFillColor(gold); ctx.fill(CGRect(x: bx, y: y, width: filled, height: bh))
    CVPixelBufferUnlockBaseAddress(buf, [])
    return buf
}

let total = Int((duration.seconds * Double(fps)).rounded(.up))
let group = DispatchGroup()
group.enter()
var n = 0, lastFilled = -1
var current: CVPixelBuffer?
vIn.requestMediaDataWhenReady(on: DispatchQueue(label: "video")) {
    while vIn.isReadyForMoreMediaData {
        if n >= total { vIn.markAsFinished(); group.leave(); return }
        let filled = min(bw, Int(Double(n) / Double(max(total - 1, 1)) * Double(bw)) / unit * unit)
        if filled != lastFilled { current = frame(filled: filled); lastFilled = filled }
        adaptor.append(current!, withPresentationTime: CMTime(value: CMTimeValue(n), timescale: fps))
        n += 1
    }
}
group.enter()
aIn.requestMediaDataWhenReady(on: DispatchQueue(label: "audio")) {
    while aIn.isReadyForMoreMediaData {
        if let s = aOut.copyNextSampleBuffer() { aIn.append(s) } else { aIn.markAsFinished(); group.leave(); return }
    }
}
group.wait()
writer.finishWriting { sem.signal() }
sem.wait()
if writer.status != .completed { print("failed: \(writer.error?.localizedDescription ?? "unknown")"); exit(1) }
print("\(outURL.lastPathComponent)  \(W)x\(H)  \(String(format: "%.1f", duration.seconds))s")
