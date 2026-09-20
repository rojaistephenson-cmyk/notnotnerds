'use client';

import { useState } from 'react';

const FACTS = [
  "Octopuses have three hearts — and two of them stop beating the moment it swims, which is probably why they'd rather walk.",
  "Honey found in 3,000-year-old Egyptian tombs is still edible. Sugar content that low, nothing wants to grow in it.",
  "Water has a triple point (about 0.01°C at low pressure) where it exists as solid, liquid, and gas all at once, in the same container.",
  "Your stomach lining replaces itself every 3 to 5 days — otherwise the acid that digests your food would start on the stomach itself.",
  "Sharks have been around for roughly 400 million years, which means they predate trees by about 50 million years.",
  "A single teaspoon of neutron star material would weigh in the neighborhood of 4 billion tons.",
  "Humans and bananas share about 60% of their DNA, give or take, depending on which genes you're counting.",
  "Bananas are mildly radioactive from their natural potassium-40 content — scientists sometimes use the 'banana equivalent dose' as an informal radiation unit.",
  "GPS satellites run about 38 microseconds fast per day from relativity (both special and general effects) — uncorrected, your phone's location would drift by several miles a day.",
  "Shuffle a deck of cards well and the exact order has almost certainly never existed before: there are about 8x10^67 possible orderings, more than the number of atoms on Earth.",
  "Light slows down when it passes through water or glass, enough that particles can briefly outrun it there — that's what causes the eerie blue Cherenkov glow around nuclear reactor cores.",
  "If you dug an idealized frictionless tunnel straight through the center of the Earth and jumped in, simple physics says you'd fall through in about 42 minutes — the same time no matter which two points you connect.",
  "The Mandelbrot set has an infinite perimeter but a finite area.",
  "Glass is an amorphous solid — it never actually finishes settling into a crystal structure.",
  "There are more possible chess games than atoms in the observable universe.",
  "Neurons in your gut produce more serotonin than the ones in your brain.",
];

export default function FunFactCard() {
  const [index, setIndex] = useState(0);

  return (
    <div className="fact-card">
      <span className="fact-tag">fact {String(index + 1).padStart(2, '0')}</span>
      <p className="fact-text">{FACTS[index]}</p>
      <button
        type="button"
        className="btn-card-ghost"
        onClick={() => setIndex((i) => (i + 1) % FACTS.length)}
      >
        another one →
      </button>
    </div>
  );
}
