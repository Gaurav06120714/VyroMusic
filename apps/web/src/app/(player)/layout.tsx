// Player layout — persistent sidebar + player bar.
// This layout NEVER unmounts between page navigations,
// so playback continues uninterrupted.
import { Sidebar } from '../../components/sidebar/Sidebar';
import { PlayerBar } from '../../components/player/PlayerBar';
import { AudioEngine } from '../../components/player/AudioEngine';
import { RadioEngine } from '../../components/player/RadioEngine';

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Singleton audio engine — never unmounts */}
      <AudioEngine />
      {/* Radio mode auto-queue — no UI, pure side-effect */}
      <RadioEngine />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Persistent player bar */}
      <PlayerBar />
    </div>
  );
}
