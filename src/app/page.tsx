import MainCanvas from '../components/mainCanvas'

export default function Home() {
  return (
    <main className="flex min-h-screen h-screen w-screen">
      <MainCanvas resolution={[320, 240]} />
    </main>
  );
}
