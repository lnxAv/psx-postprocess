import MainCanvas from '../components/mainCanvas'

export default function Home() {
  return (
    <main className="flex min-h-screen h-screen w-screen p-20">
      <MainCanvas resolution={[320, 240]} />
    </main>
  );
}
