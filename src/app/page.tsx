import PSXCanvas from '../components/PSXCanvas'

export default function Home() {
  return (
    <main className="flex min-h-screen h-screen w-screen">
      <PSXCanvas resolution={[320, 240]} dpr={0.6} jitterStrength={0.7}/>
    </main>
  );
}
