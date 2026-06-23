import videos from '../../data/videos.json'

export default function WatchDemo() {
  return (
    <section className="py-16 bg-white/60 backdrop-blur-sm border-t border-teal-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-teal-800 mb-3">
            PLATFORM DEMO VIDEOS
          </h2>
          <p className="text-gray-600">
            Learn how to use Moodle and CodeTantra effectively.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {videos.map((video, index) => (
            <div key={index}>
              <h3 className="text-xl font-semibold text-teal-700 mb-3 text-center">
                {video.title}
              </h3>

              <div className="rounded-2xl overflow-hidden shadow-lg border border-teal-200 bg-black">
                <video
                  controls
                  className="w-full"
                  preload="metadata"
                >
                  <source src={video.file} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}