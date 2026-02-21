import numpy as np
import random
from typing import Dict, Any

def risk_weight_evolution(
    model_results: Dict[str, Any],
    max_generations: int = 200,        # safety cap only
    population_size: int = 20,
    elite_size: int = 4,
    mutation_rate: float = 0.15,
    crossover_rate: float = 0.7,
    sigma_base: float = 0.1,
    stagnation_threshold: int = 12,
    diversity_threshold: float = 0.05,
    convergence_tol: float = 1e-6,
    seed: int = 42
) -> Dict[str, Any]:

    np.random.seed(seed)
    random.seed(seed)

    eps = 1e-8

    # ------------------ FITNESS ------------------ #
    def fitness(alpha: float) -> float:
        beta = 1 - alpha
        total_risk = 0.0

        for model in model_results.values():
            FAR = model["evaluation"]["FAR"]
            FRR = model["evaluation"]["FRR"]

            denom = FAR + FRR + eps
            FAR_n = FAR / denom
            FRR_n = FRR / denom

            model_risk = alpha * np.log(FAR_n + eps) + \
                         beta * np.log(FRR_n + eps)

            total_risk += model_risk

        total_risk = -total_risk

        # Interior regularization
        regularization = 1.0 * (alpha - 0.5) ** 2

        # Soft boundary barrier
        barrier = 0.05 / (alpha + eps) + 0.05 / (1 - alpha + eps)

        return total_risk + regularization + barrier

    # ------------------ TOURNAMENT ------------------ #
    def tournament_selection(pop, scores, k=3):
        idx = np.random.choice(len(pop), k, replace=False)
        best_idx = min(idx, key=lambda i: scores[i])
        return pop[best_idx]

    # ------------------ CROSSOVER ------------------ #
    def crossover(p1, p2):
        if random.random() < crossover_rate:
            return 0.7 * p1 + 0.3 * p2 if fitness(p1) < fitness(p2) else 0.7 * p2 + 0.3 * p1
        return p1

    # ------------------ MUTATION ------------------ #
    def mutate(individual, generation):
        # adaptive sigma decay
        sigma = sigma_base * (1 - generation / max_generations)
        sigma = max(sigma, 0.01)

        if random.random() < mutation_rate:
            individual += np.random.normal(0, sigma)

        return np.clip(individual, 0.001, 0.999)

    # ------------------ INITIALIZATION ------------------ #
    population = np.random.uniform(0.1, 0.9, population_size)
    scores = np.array([fitness(a) for a in population])

    best_idx = np.argmin(scores)
    best_alpha = float(population[best_idx])
    best_score = float(scores[best_idx])

    alpha_history = [best_alpha]
    fitness_history = [best_score]
    diversity_history = [np.std(population)]

    stagnation_counter = 0
    generation = 0

    # ------------------ EVOLUTION LOOP ------------------ #
    while generation < max_generations:

        generation += 1

        elite_indices = np.argsort(scores)[:elite_size]
        new_population = list(population[elite_indices])

        while len(new_population) < population_size:
            p1 = tournament_selection(population, scores)
            p2 = tournament_selection(population, scores)
            child = crossover(p1, p2)
            child = mutate(child, generation)
            new_population.append(child)

        population = np.array(new_population)
        scores = np.array([fitness(a) for a in population])

        current_best_idx = np.argmin(scores)
        current_best_alpha = float(population[current_best_idx])
        current_best_score = float(scores[current_best_idx])

        alpha_history.append(current_best_alpha)
        fitness_history.append(current_best_score)
        diversity_history.append(np.std(population))

        improvement = abs(best_score - current_best_score)

        if current_best_score < best_score:
            best_alpha = current_best_alpha
            best_score = current_best_score
            stagnation_counter = 0
        else:
            stagnation_counter += 1

        # --- Early Convergence Stop ---
        if improvement < convergence_tol and stagnation_counter >= stagnation_threshold:
            break

        # --- Diversity Injection ---
        if np.std(population) < diversity_threshold:
            inject_idx = np.random.choice(population_size, 2)
            population[inject_idx] = np.random.uniform(0.1, 0.9, 2)

        # --- Stagnation Recovery ---
        if stagnation_counter > stagnation_threshold:
            for i in range(population_size):
                population[i] = mutate(population[i], generation)
            stagnation_counter = 0

    best_beta = 1 - best_alpha

    optimized_scores = {
        name: round(best_alpha * model["evaluation"]["FAR"] +
                    best_beta * model["evaluation"]["FRR"], 6)
        for name, model in model_results.items()
    }

    return {
        "alpha": round(best_alpha, 4),
        "beta": round(best_beta, 4),
        "best_model": min(optimized_scores, key=optimized_scores.get),
        "scores": optimized_scores,
        "history": {
            "alpha": alpha_history,
            "fitness": fitness_history,
            "diversity": diversity_history
        },
        "generations_used": generation
    }