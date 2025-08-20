import os
import torch
from TTS.api import TTS
from pydub import AudioSegment, silence
from moviepy.editor import VideoFileClip, AudioFileClip
import soundfile as sf
from collections import defaultdict
import os

device = "cuda" if torch.cuda.is_available() else "cpu"

os.environ["COQUI_TOS_AGREED"] = "1"

tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)

def srt_time_to_ms(srt_time):
    hours, minutes, seconds = srt_time.split(':')
    seconds, milliseconds = seconds.split(',')
    return (int(hours) * 3600 + int(minutes) * 60 + int(seconds)) * 1000 + int(milliseconds)

def remove_silence(audio_path, threshold=-40, min_silence_len=300):
    sound = AudioSegment.from_wav(audio_path)
    non_silent_ranges = silence.detect_nonsilent(sound, min_silence_len=min_silence_len, silence_thresh=threshold)
    trimmed_audio = AudioSegment.silent(duration=0)
    for start, end in non_silent_ranges:
        trimmed_audio += sound[start:end]
    trimmed_audio.export(audio_path, format="wav")

def parse_srt(srt_content):
    lines = srt_content.strip().split('\n')
    segments = defaultdict(list)
    i = 0
    while i < len(lines):
        if lines[i].strip().isdigit():
            j = i + 1
            speaker = None
            # Identify the speaker
            if j < len(lines) and lines[j].startswith('['):
                speaker = lines[j].strip('[]')
                j += 1
            # Find the time range line
            if j < len(lines) and "-->" in lines[j]:
                start_time, end_time = lines[j].split(' --> ')
                # Collect all text lines until the next sequence number or end of file
                text_lines = []
                k = j + 1
                while k < len(lines) and not lines[k].strip().isdigit():
                    if lines[k].strip():  # Ensure the line is not empty
                        text_lines.append(lines[k].strip())
                    k += 1
                text = ' '.join(text_lines)
                start_ms = srt_time_to_ms(start_time.strip())
                end_ms = srt_time_to_ms(end_time.strip())
                if speaker:
                    segments[speaker].append((start_ms, end_ms, text))
            i = k
        else:
            i += 1
    return segments

def extract_speaker_audio(video_audio, segments, speaker):
    combined_audio = AudioSegment.silent(duration=0)
    for start_ms, end_ms, _ in segments[speaker]:
        combined_audio += video_audio[start_ms:end_ms]
    return combined_audio

def process_video_and_srt(video_data, srt_data, original_ext, language, original_name, dub_speed_factor=1.0):
    # Define the temporary directory
    temp_dir = "/tmp/uploads"
    os.makedirs(temp_dir, exist_ok=True)

    # Save video to a temporary file
    video_filename = os.path.join(temp_dir, "temp_video" + original_ext)
    with open(video_filename, 'wb') as f:
        f.write(video_data)

    # Save SRT to a temporary file
    srt_filename = os.path.join(temp_dir, "temp_subtitles.srt")
    with open(srt_filename, 'w', encoding='utf-8') as f:
        f.write(srt_data)

    # Load the video and extract audio
    video = VideoFileClip(video_filename, fps_source="fps")
    audio_path = os.path.join(temp_dir, "extracted_audio.wav")
    video.audio.write_audiofile(audio_path)

    # Parse SRT content
    segments = parse_srt(srt_data)

    # Load the extracted audio
    original_audio_segment = AudioSegment.from_wav(audio_path)

    # Create a new audio segment for the dubbed audio
    dubbed_audio = AudioSegment.silent(duration=len(original_audio_segment))
    temp_tts_path = os.path.join(temp_dir, "temp_tts_output.wav")

    # Process each speaker
    for speaker in segments:
        # Extract and save combined audio for the speaker
        speaker_audio = extract_speaker_audio(original_audio_segment, segments, speaker)
        speaker_audio_path = os.path.join(temp_dir, f"{speaker}_audio.wav")
        speaker_audio.export(speaker_audio_path, format="wav")

        # Use the combined speaker audio for TTS
        for start_ms, end_ms, text in segments[speaker]:
            wav = tts.tts(text=text, speaker_wav=speaker_audio_path, language=language)
            sf.write(temp_tts_path, wav, samplerate=22050)
            remove_silence(temp_tts_path)
            tts_audio = AudioSegment.from_wav(temp_tts_path)
            
            if dub_speed_factor != 1.0 and dub_speed_factor > 0:
                tts_audio = tts_audio.speedup(playback_speed=dub_speed_factor)
            
            tts_duration = len(tts_audio)
            available_duration = end_ms - start_ms
            if tts_duration < available_duration:
                tts_audio += AudioSegment.silent(duration=available_duration - tts_duration)
            # Orijinal kodda, tts_duration > available_duration ise burada bir kırpma yok.
            # Overlay işlemi bu durumu kendi içinde yönetir veya video süresi belirleyici olur.
            dubbed_audio = dubbed_audio.overlay(tts_audio, position=start_ms)

    # Export the final dubbed audio as AAC
    dubbed_audio_path = os.path.join(temp_dir, "dubbed_audio.aac")
    dubbed_audio.export(dubbed_audio_path, format="mp4")

    # Load the dubbed audio and set it to the video
    dubbed_audio_clip = AudioFileClip(dubbed_audio_path)
    final_video = video.set_audio(dubbed_audio_clip).set_duration(video.duration)

    # Define final video file path
    final_video_name = os.path.join(temp_dir, f"{original_name}(dubbing).mp4")

    # Define a safe path for MoviePy's temp audiofile
    temp_audiofile_path = os.path.join(temp_dir, "temp_moviepy_audio.m4a")

    # Write the final video, using the safe temp audiofile path
    final_video.write_videofile(
        final_video_name,
        codec='libx264',
        audio_codec='aac',
        fps=video.fps,
        temp_audiofile=temp_audiofile_path,
        remove_temp=True
    )
    return final_video_name

def main(in_memory_files, dubbinglang, dub_speed_factor=1.2):
    results = {}

    video_filename = next((k for k in in_memory_files.keys() if k.endswith('.mp4')), None)
    srt_filename = next((k for k in in_memory_files.keys() if k.endswith('.srt')), None)

    if video_filename is None or srt_filename is None:
        raise ValueError("Gerekli dosyalar (video ve/veya srt) bulunamadı.")

    video_data = in_memory_files[video_filename]
    srt_data = in_memory_files[srt_filename].decode('utf-8')
    original_name, original_ext = os.path.splitext(video_filename)

    # Process the video and SRT
    final_video_data = process_video_and_srt(video_data, srt_data, original_ext, dubbinglang, original_name, dub_speed_factor)

    # Add the processed video to the results dictionary
    results[f"{original_name}(dubbing){original_ext}"] = final_video_data
    
    return results