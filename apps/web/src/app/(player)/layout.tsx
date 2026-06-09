import { Sidebar } from '../../components/sidebar/Sidebar';
import { PlayerBar } from '../../components/player/PlayerBar';
import { AudioEngine } from '../../components/player/AudioEngine';
import { RadioEngine } from '../../components/player/RadioEngine';
import { LyricsOverlay } from '../../components/player/LyricsOverlay';
import { MobileNav } from '../../components/navigation/MobileNav';
import { MiniPlayer } from '../../components/player/MiniPlayer';

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {}
      <AudioEngine />
      {}
      <RadioEngine />
      {}
      <LyricsOverlay />

      <div className="flex flex-1 overflow-hidden">
        {}
        <Sidebar />

        {}
        <main className="flex-1 overflow-y-auto pb-28 md:pb-0">
          {children}
        </main>
      </div>

      {}
      <div className="hidden md:block">
        <PlayerBar />
      </div>

      {}
      <MiniPlayer />

      {}
      <MobileNav />
    </div>
  );
}
