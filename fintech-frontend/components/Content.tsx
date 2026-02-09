export default function Content() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12 space-y-12 text-base-content">
      
      {/* Hero / Introduction */}
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          Efficient CNN Model Compression Analysis
        </h1>

        <p className="leading-relaxed max-w-3xl opacity-80">
          Convolutional Neural Networks (CNNs) achieve state-of-the-art
          performance in image recognition tasks. However, their high
          computational and memory requirements often make deployment
          challenging on resource-constrained devices.
        </p>
      </section>

      {/* Project Description */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">
          Project Overview
        </h2>

        <p className="leading-relaxed ">
          Several model compression techniques—such as{" "}
          <span className="font-medium">pruning</span>,{" "}
          <span className="font-medium">quantization</span>,{" "}
          <span className="font-medium">low-rank factorization</span>,{" "}
          <span className="font-medium">knowledge distillation</span>, and{" "}
          <span className="font-medium">weight sharing</span>—have been
          proposed to reduce model complexity.
        </p>

        <p className="leading-relaxed ">
          This project evaluates these five techniques using a standard CNN
          trained on the <span className="font-medium">MNIST dataset</span>,
          focusing on efficiency vs reliability trade-offs.
        </p>
      </section>

      {/* Evaluation Metrics */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">
          Evaluation Criteria
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            "Model accuracy on clean inputs",
            "Inference time performance",
            "Model size and memory footprint",
            "Robustness against noisy inputs",
          ].map((item) => (
            <div
              key={item}
              className="rounded-lg border border-base-300 bg-base-200 px-4 py-3 text-sm"
            >
              {item}
            </div>
          ))}
        </div>

        <p className="leading-relaxed opacity-80">
          In addition to clean datasets, noise-added datasets are used to
          evaluate robustness based on accuracy and inference time.
        </p>
      </section>

      {/* Objective */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">
          Objective
        </h2>

        <p className="leading-relaxed max-w-3xl opacity-80">
          The study provides insights into the trade-offs between computational
          efficiency and predictive reliability for deployment in
          resource-constrained environments.
        </p>
      </section>

      {/* Team */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold">
          Team Members
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { name: "Sai Vikas", id: "CB.EN.U4CSE22363" },
            { name: "Albert", id: "CB.EN.U4CSE22505" },
            { name: "Rathna", id: "CB.EN.U4CSE22526" },
            { name: "Mukesh", id: "CB.EN.U4CSE22531" },
          ].map((member) => (
            <div
              key={member.id}
              className="rounded-lg border border-base-300 px-4 py-3"
            >
              <p className="font-medium">
                {member.name}
              </p>
              <p className="text-sm opacity-70">
                {member.id}
              </p>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}
