let currentInput = '';
let previousInput = '';
let operation = null;

function appendNumber(number) {
  if (number === "." && currentInput.includes(".")) {
    return;
  }
  currentInput += number;
  document.getElementById("display").value = currentInput;
}

function setOperation(op) {
  if (currentInput === "") {
    return;
  }
  previousInput = currentInput;
  operation = op;
  currentInput = "";
  document.getElementById("display").value = "";
}

function clearDisplay() {
  currentInput = "";
  previousInput = "";
  operation = null;
  document.getElementById("display").value = "";
}

function calculate() {
  if (previousInput === "" || currentInput === "") {
    document.getElementById("display").value = "Error";
    return;
  }
  let previous = parseFloat(previousInput);
  let current = parseFloat(currentInput);
  let result;
  if (operation === "+") {
    result = previous + current;
  }
  else if (operation === "-") {
    result = previous - current;
  }
  else if (operation === "*") {
    result = previous * current;
  }
  else if (operation == "/") {
    if (current === 0) {
      document.getElementById("display").value = "Cannot divide by zero";
      return;
    }
    result = previous / current;
  }
  currentInput = result.toString();
  previousInput = "";
  operation = null;
  document.getElementById("display").value = currentInput;
}

function updateDisplay() {
  document.getElementById('display').value = currentInput;
}

function printToDisplay(message) {
  document.getElementById('display').value = message;
}
