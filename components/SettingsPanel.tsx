'use client';

import * as React from 'react';
import { StudioSettings, MediaDeviceInfoSimple } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  SlidersHorizontal,
  Video,
  Mic,
  Camera,
  Settings2,
  Sparkles,
  Info,
} from 'lucide-react';

interface SettingsPanelProps {
  settings: StudioSettings;
  audioDevices: MediaDeviceInfoSimple[];
  videoDevices: MediaDeviceInfoSimple[];
  disabled?: boolean;
  onUpdate: (partial: Partial<StudioSettings>) => void;
}

export function SettingsPanel({
  settings,
  audioDevices,
  videoDevices,
  disabled,
  onUpdate,
}: SettingsPanelProps) {
  return (
    <Card className="border-border/70 shadow-md">
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-purple-500" />
            <CardTitle className="text-base font-semibold">Studio Settings</CardTitle>
          </div>
          <span className="text-xs text-muted-foreground">Tailor your recording</span>
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-5">
        <Tabs defaultValue="video" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4 h-9">
            <TabsTrigger value="video" className="text-xs gap-1.5">
              <Video className="h-3.5 w-3.5" />
              <span>Video</span>
            </TabsTrigger>
            <TabsTrigger value="audio" className="text-xs gap-1.5">
              <Mic className="h-3.5 w-3.5" />
              <span>Audio</span>
            </TabsTrigger>
            <TabsTrigger value="webcam" className="text-xs gap-1.5">
              <Camera className="h-3.5 w-3.5" />
              <span>Webcam</span>
            </TabsTrigger>
            <TabsTrigger value="general" className="text-xs gap-1.5">
              <Settings2 className="h-3.5 w-3.5" />
              <span>General</span>
            </TabsTrigger>
          </TabsList>

          {/* 1. VIDEO SETTINGS */}
          <TabsContent value="video" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Resolution */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Output Resolution</Label>
                <Select
                  value={settings.resolution}
                  disabled={disabled}
                  onValueChange={(val) => onUpdate({ resolution: val as StudioSettings['resolution'] })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select resolution" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="native">Native (Auto Display)</SelectItem>
                    <SelectItem value="3840x2160">4K UHD (2160p)</SelectItem>
                    <SelectItem value="2560x1440">2K QHD (1440p)</SelectItem>
                    <SelectItem value="1920x1080">1080p Full HD (Recommended)</SelectItem>
                    <SelectItem value="1280x720">720p HD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Frame Rate */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Frame Rate (FPS)</Label>
                <Select
                  value={String(settings.frameRate)}
                  disabled={disabled}
                  onValueChange={(val) => onUpdate({ frameRate: Number(val) as StudioSettings['frameRate'] })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select FPS" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">60 FPS (Ultra Smooth)</SelectItem>
                    <SelectItem value="30">30 FPS (Standard)</SelectItem>
                    <SelectItem value="24">24 FPS (Cinematic)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Output Format */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center justify-between">
                  <span>Container Format</span>
                  <span className="text-[10px] text-purple-500 font-semibold">Real MP4</span>
                </Label>
                <Select
                  value={settings.format}
                  disabled={disabled}
                  onValueChange={(val) => onUpdate({ format: val as StudioSettings['format'] })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mp4">MP4 (H.264 / AAC) — Universal</SelectItem>
                    <SelectItem value="webm">WebM (VP9 / Opus) — Open Web</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bitrate */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Video Bitrate</Label>
                <Select
                  value={String(settings.bitrateMbps)}
                  disabled={disabled}
                  onValueChange={(val) => onUpdate({ bitrateMbps: Number(val) })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select bitrate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">Ultra (12 Mbps)</SelectItem>
                    <SelectItem value="8">High Quality (8 Mbps)</SelectItem>
                    <SelectItem value="5">Balanced (5 Mbps)</SelectItem>
                    <SelectItem value="2.5">Compact (2.5 Mbps)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/40 p-3 flex items-start gap-2.5 text-xs text-muted-foreground">
              <Info className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
              <p>
                MP4 output uses direct hardware-accelerated H.264 client-side encoding. Recordings play natively on Windows, macOS, QuickTime, iOS, Android, and PowerPoint without server conversion.
              </p>
            </div>
          </TabsContent>

          {/* 2. AUDIO SETTINGS */}
          <TabsContent value="audio" className="space-y-4">
            {/* Microphone Toggle & Device */}
            <div className="space-y-3 rounded-lg border p-3.5 bg-card/60">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-semibold">Microphone Audio</Label>
                  <p className="text-[11px] text-muted-foreground">Capture your voice from mic</p>
                </div>
                <Switch
                  checked={settings.micEnabled}
                  disabled={disabled}
                  onCheckedChange={(checked) => onUpdate({ micEnabled: checked })}
                />
              </div>

              {settings.micEnabled && (
                <div className="space-y-3 pt-2 border-t border-border/50">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground">Input Microphone Device</Label>
                    <Select
                      value={settings.micDeviceId || audioDevices[0]?.deviceId || 'default-mic'}
                      disabled={disabled}
                      onValueChange={(val) => onUpdate({ micDeviceId: val })}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Select microphone" />
                      </SelectTrigger>
                      <SelectContent>
                        {audioDevices.length > 0 ? (
                          audioDevices.map((dev, idx) => (
                            <SelectItem key={dev.deviceId || idx} value={dev.deviceId || `mic-${idx + 1}`}>
                              {dev.label || `Microphone ${idx + 1}`}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="default-mic">System Default Microphone</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Microphone Volume</span>
                      <span className="font-mono font-medium">{Math.round(settings.micVolume * 100)}%</span>
                    </div>
                    <Slider
                      value={[settings.micVolume]}
                      min={0}
                      max={2}
                      step={0.05}
                      disabled={disabled}
                      onValueChange={([val]) => onUpdate({ micVolume: val })}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* System Audio Toggle & Volume */}
            <div className="space-y-3 rounded-lg border p-3.5 bg-card/60">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-semibold">System Audio</Label>
                  <p className="text-[11px] text-muted-foreground">Capture sound from tabs, games, or apps</p>
                </div>
                <Switch
                  checked={settings.sysAudioEnabled}
                  disabled={disabled}
                  onCheckedChange={(checked) => onUpdate({ sysAudioEnabled: checked })}
                />
              </div>

              {settings.sysAudioEnabled && (
                <div className="space-y-1.5 pt-2 border-t border-border/50">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">System Volume</span>
                    <span className="font-mono font-medium">{Math.round(settings.sysVolume * 100)}%</span>
                  </div>
                  <Slider
                    value={[settings.sysVolume]}
                    min={0}
                    max={2}
                    step={0.05}
                    disabled={disabled}
                    onValueChange={([val]) => onUpdate({ sysVolume: val })}
                  />
                </div>
              )}
            </div>
          </TabsContent>

          {/* 3. WEBCAM SETTINGS */}
          <TabsContent value="webcam" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Camera Device */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Camera Device</Label>
                <Select
                  value={settings.camDeviceId || videoDevices[0]?.deviceId || 'default-cam'}
                  disabled={disabled}
                  onValueChange={(val) => onUpdate({ camDeviceId: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select camera" />
                  </SelectTrigger>
                  <SelectContent>
                    {videoDevices.length > 0 ? (
                      videoDevices.map((dev, idx) => (
                        <SelectItem key={dev.deviceId || idx} value={dev.deviceId || `cam-${idx + 1}`}>
                          {dev.label || `Camera ${idx + 1}`}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="default-cam">System Default Camera</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Camera Shape */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Overlay Shape</Label>
                <Select
                  value={settings.camShape}
                  disabled={disabled}
                  onValueChange={(val) => onUpdate({ camShape: val as StudioSettings['camShape'] })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select shape" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="circle">Circle (Loom Style)</SelectItem>
                    <SelectItem value="rounded">Rounded Rectangle</SelectItem>
                    <SelectItem value="square">Square</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Camera Position */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Corner Position</Label>
                <Select
                  value={settings.camPosition}
                  disabled={disabled}
                  onValueChange={(val) => onUpdate({ camPosition: val as StudioSettings['camPosition'] })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    <SelectItem value="top-right">Top Right</SelectItem>
                    <SelectItem value="top-left">Top Left</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Camera Size */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Overlay Size</Label>
                <Select
                  value={settings.camSize}
                  disabled={disabled}
                  onValueChange={(val) => onUpdate({ camSize: val as StudioSettings['camSize'] })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (Compact)</SelectItem>
                    <SelectItem value="medium">Medium (Standard)</SelectItem>
                    <SelectItem value="large">Large (Prominent)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-xs font-semibold">Mirror Camera</Label>
                <p className="text-[11px] text-muted-foreground">Flips video horizontally (natural mirror view)</p>
              </div>
              <Switch
                checked={settings.mirrorCam}
                disabled={disabled}
                onCheckedChange={(checked) => onUpdate({ mirrorCam: checked })}
              />
            </div>
          </TabsContent>

          {/* 4. GENERAL SETTINGS */}
          <TabsContent value="general" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Project Filename */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Default Filename</Label>
                <Input
                  value={settings.projectName}
                  disabled={disabled}
                  placeholder="snapREC_recording"
                  onChange={(e) => onUpdate({ projectName: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              {/* Countdown Timer */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Countdown Delay</Label>
                <Select
                  value={String(settings.countdownSeconds)}
                  disabled={disabled}
                  onValueChange={(val) => onUpdate({ countdownSeconds: Number(val) })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Countdown" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No Countdown (Immediate)</SelectItem>
                    <SelectItem value="3">3 Seconds Delay</SelectItem>
                    <SelectItem value="5">5 Seconds Delay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
