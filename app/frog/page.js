export const metadata = {
  title: 'Frog',
  robots: { index: false, follow: false },
}

export default function FrogPage() {
  return (
    <div className="frog-page px-4 py-8 md:py-12">
      <div className="frog-card mx-auto w-full max-w-5xl text-center">
        <h1 className="mb-4 text-3xl font-bold text-white md:text-4xl">Frog</h1>
        <p className="mb-6 text-lg text-gray-300 md:text-xl">You&apos;ve been frogged! 🐸</p>
        <img
          src="https://cdn.modrinth.com/frog.png"
          alt="A photorealistic painting of a frog labyrinth"
          className="mx-auto mb-6 w-[60%] max-w-[40rem]"
        />
      </div>
    </div>
  )
}
