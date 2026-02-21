export default function Content() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16 space-y-20 text-base-content">

      {/* ===================================================== */}
      {/* HERO SECTION */}
      {/* ===================================================== */}
      <section className="space-y-6">
        <div className="h-12 w-1 bg-primary rounded-full" />

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
          Efficient CNN Model Compression & Confidence-Aware Risk Optimization
        </h1>

        <p className="text-lg max-w-3xl opacity-80 leading-relaxed">
          This research explores the trade-off between computational efficiency 
          and predictive reliability in compressed Convolutional Neural Networks (CNNs). 
          By integrating model compression techniques with a Genetic Algorithm–based 
          risk weighting engine, the system identifies deployment-ready models 
          optimized for real-world resource-constrained environments.
        </p>
      </section>

      {/* ===================================================== */}
      {/* PROJECT OVERVIEW */}
      {/* ===================================================== */}
      <section className="grid md:grid-cols-2 gap-14 items-start">

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">
            Project Overview
          </h2>

          <p className="opacity-80 leading-relaxed">
            Modern CNNs deliver state-of-the-art accuracy but demand 
            significant memory and computation. This project evaluates 
            structured and unstructured compression strategies to reduce 
            model size and latency while preserving reliability.
          </p>

          <ul className="list-disc list-inside space-y-2 opacity-90">
            <li><span className="font-medium">Pruning</span> — Remove redundant weights</li>
            <li><span className="font-medium">Quantization</span> — Reduce numerical precision</li>
            <li><span className="font-medium">Low-Rank Factorization</span> — Decompose weight matrices</li>
            <li><span className="font-medium">Knowledge Distillation</span> — Transfer knowledge from teacher model</li>
            <li><span className="font-medium">Weight Sharing</span> — Cluster and reuse parameters</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-base-300 bg-base-200 p-8 space-y-5">
          <h3 className="text-lg font-semibold">
            System Specifications
          </h3>

          <Spec label="Dataset" value="MNIST (28x28 grayscale digits)" />
          <Spec label="Architecture" value="Standard CNN (Conv → ReLU → Pool → FC)" />
          <Spec label="Compression Methods" value="5 Techniques" />
          <Spec label="Optimization Engine" value="Genetic Algorithm" />
          <Spec label="Fitness Objective" value="Normalized FAR / FRR Log-Risk" />
        </div>
      </section>

      {/* ===================================================== */}
      {/* RISK OPTIMIZATION ENGINE */}
      {/* ===================================================== */}
      <section className="space-y-8">
        <h2 className="text-2xl font-semibold">
          Confidence-Aware Risk Weight Evolution
        </h2>

        <p className="max-w-3xl opacity-80 leading-relaxed">
          The system optimizes the trade-off between False Acceptance Rate (FAR) 
          and False Rejection Rate (FRR) using a Genetic Algorithm. A single 
          weighting parameter α is evolved to minimize total normalized risk 
          across all compressed models.
        </p>

        <div className="rounded-xl bg-base-200 p-6 border border-base-300 font-mono text-sm">
          Risk(α) = α · log(FAR_norm) + (1 − α) · log(FRR_norm)
        </div>

        <p className="opacity-80 max-w-3xl leading-relaxed">
          Log-scaling stabilizes optimization, preventing dominance from skewed 
          distributions. Interior regularization and soft boundary penalties 
          prevent collapse toward extreme α values.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            "Max Generations: 200",
            "Population Size: 20",
            "Elite Retention: 4",
            "Tournament Selection",
            "Crossover Blending",
            "Adaptive Mutation Decay",
            "Diversity Injection",
            "Early Convergence Detection"
          ].map((item) => (
            <div
              key={item}
              className="rounded-lg border border-base-300 bg-base-200 px-4 py-3 text-sm"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* ===================================================== */}
      {/* EVOLUTION STRATEGY DETAILS */}
      {/* ===================================================== */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">
          Evolution Strategy Design
        </h2>

        <p className="opacity-80 max-w-3xl leading-relaxed">
          The Genetic Algorithm evolves α using controlled stochastic search:
        </p>

        <ul className="space-y-3 opacity-90">
          <li>• Tournament-based parent selection</li>
          <li>• Elitism to preserve top solutions</li>
          <li>• Blended crossover for smooth interpolation</li>
          <li>• Adaptive mutation with sigma decay</li>
          <li>• Diversity reinjection when population collapses</li>
          <li>• Stagnation-based recovery mechanism</li>
        </ul>

        <p className="opacity-80 max-w-3xl leading-relaxed">
          Convergence occurs when improvement falls below tolerance and 
          stagnation persists across generations.
        </p>
      </section>

      {/* ===================================================== */}
      {/* EVALUATION METRICS */}
      {/* ===================================================== */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">
          Evaluation Criteria
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          {[
            "Accuracy on Clean Inputs",
            "Robustness to Noise",
            "Model Size Reduction",
            "Inference Latency",
            "FAR / FRR Trade-off",
            "Entropy Stability",
            "Confidence Calibration",
            "Deployment Feasibility"
          ].map((item) => (
            <div
              key={item}
              className="rounded-lg border border-base-300 bg-base-200 px-4 py-3 text-sm"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* ===================================================== */}
      {/* RESEARCH OBJECTIVE */}
      {/* ===================================================== */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">
          Research Objective
        </h2>

        <p className="max-w-3xl opacity-80 leading-relaxed">
          The objective is to identify compression strategies that minimize 
          computational cost while preserving predictive reliability. 
          The risk-weight evolution mechanism ensures deployment-aware 
          decision calibration for financial-grade validation systems.
        </p>
      </section>

      {/* ===================================================== */}
      {/* TEAM SECTION */}
      {/* ===================================================== */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">
          Research Team
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            { name: "Sai Vikas", id: "CB.EN.U4CSE22363" },
            { name: "Albert", id: "CB.EN.U4CSE22505" },
            { name: "Rathna", id: "CB.EN.U4CSE22526" },
            { name: "Mukesh", id: "CB.EN.U4CSE22531" },
          ].map((member) => (
            <div
              key={member.id}
              className="rounded-xl border border-base-300 px-6 py-5"
            >
              <p className="font-semibold text-lg">{member.name}</p>
              <p className="text-sm opacity-70">{member.id}</p>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}

/* Small reusable spec component */
function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}