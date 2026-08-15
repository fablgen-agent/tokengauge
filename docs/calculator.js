const prices = {
  sol: { input: 5, cached: 0.5, output: 30 },
  terra: { input: 2.5, cached: 0.25, output: 15 },
  luna: { input: 1, cached: 0.1, output: 6 },
};

const ids = ["model", "calls", "input", "output", "input-reduction", "output-reduction", "cache"];
const elements = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function calculate() {
  const price = prices[elements.model.value];
  const calls = Math.max(Number(elements.calls.value) || 0, 0);
  const input = Math.max(Number(elements.input.value) || 0, 0);
  const output = Math.max(Number(elements.output.value) || 0, 0);
  const inputReduction = Number(elements["input-reduction"].value);
  const outputReduction = Number(elements["output-reduction"].value);
  const cacheShare = Number(elements.cache.value);
  const optimizedInput = input * (1 - inputReduction / 100);
  const optimizedOutput = output * (1 - outputReduction / 100);
  const cached = optimizedInput * cacheShare / 100;
  const before = calls * (input * price.input + output * price.output) / 1_000_000;
  const after = calls * ((optimizedInput - cached) * price.input + cached * price.cached + optimizedOutput * price.output) / 1_000_000;
  const difference = before - after;
  const percentage = before ? difference / before * 100 : 0;
  document.getElementById("before").textContent = money(before);
  document.getElementById("after").textContent = money(after);
  document.getElementById("saving").textContent = `${difference >= 0 ? "Potential saving" : "Potential increase"}: ${money(Math.abs(difference))} (${Math.abs(percentage).toFixed(1)}%)`;
  document.getElementById("input-reduction-value").textContent = `${inputReduction}%`;
  document.getElementById("output-reduction-value").textContent = `${outputReduction}%`;
  document.getElementById("cache-value").textContent = `${cacheShare}%`;
}

for (const element of Object.values(elements)) element.addEventListener("input", calculate);
calculate();
