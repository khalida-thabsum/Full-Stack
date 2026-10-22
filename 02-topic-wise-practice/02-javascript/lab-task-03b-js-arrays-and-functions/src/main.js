// Lab Task 3b: Arrays and functions - seven programs

// Program 1: Palindromes from a list of words (string + array methods)
function findPalindromes(words) {
  const clean = w => w.toLowerCase().replace(/[^a-z]/g, "");
  const isPal = w => clean(w) === clean(w).split("").reverse().join("");
  return words.filter(isPal);
}

// Program 2: Word frequency table using reduce and sorting the entries
function wordFrequency(sentence) {
  const counts = sentence
    .toLowerCase()
    .match(/[a-z']+/g)
    .reduce((acc, w) => ({ ...acc, [w]: (acc[w] || 0) + 1 }), {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

// Program 3: Matrix transpose and matrix multiplication with nested map
const transpose = m => m[0].map((_, c) => m.map(row => row[c]));
const multiplyMatrices = (a, b) => a.map(row => transpose(b).map(col => row.reduce((s, v, i) => s + v * col[i], 0)));

// Program 4: Binary search (iterative) returning the number of steps taken
function binarySearch(sorted, target) {
  let lo = 0, hi = sorted.length - 1, steps = 0;
  while (lo <= hi) {
    steps++;
    const mid = Math.floor((lo + hi) / 2);
    if (sorted[mid] === target) return { index: mid, steps };
    if (sorted[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return { index: -1, steps };
}

// Program 5: Group an array of objects by a key (reduce) and compute group averages
function groupBy(arr, key) {
  return arr.reduce((groups, item) => {
    (groups[item[key]] ||= []).push(item);
    return groups;
  }, {});
}

// Program 6: Destructuring, spread and default values in function parameters
function describeStudent({ name, branch = "CSM", marks: [first = 0, ...rest] = [] }) {
  const all = [first, ...rest];
  return `${name} (${branch}) - first mark ${first}, best ${Math.max(...all)}, ${all.length} subject${all.length === 1 ? "" : "s"}`;
}

// Program 7: Generator function and a memoised (cached) recursive function
function* fibonacci(limit) {
  let [a, b] = [0, 1];
  while (a <= limit) {
    yield a;
    [a, b] = [b, a + b];
  }
}
function memoize(fn) {
  const cache = new Map();
  return n => {
    if (!cache.has(n)) cache.set(n, fn(n));
    return cache.get(n);
  };
}
const ways = memoize(n => (n <= 1 ? 1 : ways(n - 1) + ways(n - 2))); // ways to climb n stairs taking 1 or 2 steps

// ----- run everything -----
const marksList = [
  { name: "Asha", section: "A", marks: 82 }, { name: "Bala", section: "B", marks: 67 },
  { name: "Chitra", section: "A", marks: 91 }, { name: "Dinesh", section: "B", marks: 74 },
  { name: "Esha", section: "C", marks: 58 }
];

const programs = {
  "1. Palindromes": () => {
    const words = ["Madam", "level", "React", "Racecar", "node", "Malayalam", "noon"];
    return `Words: ${words.join(", ")}\nPalindromes: ${findPalindromes(words).join(", ")}`;
  },
  "2. Word frequency": () => {
    const s = "the quick fox and the lazy dog and the cat";
    return `Sentence: "${s}"\n` + wordFrequency(s).map(([w, n]) => `${w.padEnd(6)} ${"*".repeat(n)} (${n})`).join("\n");
  },
  "3. Matrices": () => {
    const A = [[1, 2], [3, 4]], B = [[5, 6], [7, 8]];
    return `A = ${JSON.stringify(A)}\nTranspose(A) = ${JSON.stringify(transpose(A))}\nA x B = ${JSON.stringify(multiplyMatrices(A, B))}`;
  },
  "4. Binary search": () => {
    const arr = Array.from({ length: 50 }, (_, i) => i * 3);
    const hit = binarySearch(arr, 87), miss = binarySearch(arr, 88);
    return `Array: 0, 3, 6 ... 147 (50 items)\nSearch 87: index ${hit.index} in ${hit.steps} steps\nSearch 88: index ${miss.index} in ${miss.steps} steps`;
  },
  "5. Group by and averages": () => {
    const groups = groupBy(marksList, "section");
    return Object.entries(groups).map(([sec, list]) => {
      const avg = list.reduce((s, x) => s + x.marks, 0) / list.length;
      return `Section ${sec}: ${list.map(x => x.name).join(", ")} | average ${avg.toFixed(1)}`;
    }).join("\n");
  },
  "6. Destructuring and spread": () => [
    describeStudent({ name: "Farhan", branch: "CSE", marks: [72, 88, 64] }),
    describeStudent({ name: "Gowri", marks: [90] }),
    describeStudent({ name: "Hari" })
  ].join("\n"),
  "7. Generator and memoisation": () =>
    `Fibonacci up to 100: ${[...fibonacci(100)].join(", ")}\nWays to climb 10 stairs: ${ways(10)}, 40 stairs: ${ways(40)}`
};

if (typeof document !== "undefined") {
  const nav = document.getElementById("tabs");
  const out = document.getElementById("out");
  Object.keys(programs).forEach((title, i) => {
    const b = document.createElement("button");
    b.textContent = title;
    b.addEventListener("click", () => {
      nav.querySelectorAll("button").forEach(x => x.classList.remove("on"));
      b.classList.add("on");
      out.textContent = programs[title]();
    });
    nav.appendChild(b);
    if (i === 0) b.click();
  });
} else {
  for (const [title, run] of Object.entries(programs)) console.log(`\n${title}\n${run()}`);
}
