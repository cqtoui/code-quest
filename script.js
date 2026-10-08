'use strict';

/* =====================================================
   CodeQuest – script.js (Version 2)
   Sections:
     1 SETTINGS          numbers you may want to change
     2 CHALLENGE DATA    the five Python questions (edit here)
     3 GAME STATE        everything the game remembers
     4 GAME LOGIC        scoring, shuffling, checks (no HTML here)
     5 SCREEN RENDERING  draws things on the page
     6 EVENT HANDLERS    what happens on each click
     7 START-UP          connects everything together
   ===================================================== */

/* ---------- 1. SETTINGS ---------- */
const SETTINGS = {
  pointsPerChallenge: 20, // points for a correct answer with no hints
  hintPenalty: 5,         // points lost for each hint used
  minCorrectPoints: 5,    // a correct answer is never worth less than this
  maxHints: 3             // hints available per challenge
};

/* ---------- 2. CHALLENGE DATA ----------
   This block holds ONLY the questions, with no game logic, so it is safe to edit.
   Each challenge needs:
     id            a unique number
     concept       short topic name (shown above the question)
     prompt        the question
     code          code shown above the options ('' hides the box)
     optionStyle   'code' (code font) or 'text' (normal font)
     options       the answer choices, in any order (the game shuffles them every time)
     correctIndex  position of the right answer in THIS list (0 = first)
     hints         exactly 3 hints, gentle to stronger. Hint 3 should guide, not give the answer.
     explanation   shown after answering. Do not say "the last option": the order changes.
     revisit       topic shown on the results screen if missed
   Use \n inside a string for a new line. */
const CHALLENGES = [
  {
    id: 1,
    concept: 'Variables and assignment',
    prompt: 'What does this program print?',
    code: 'x = 7\ny = x\nx = 3\nprint(y)',
    optionStyle: 'code',
    options: ['3', '7', '10', 'Error'],
    correctIndex: 1,
    hints: [
      'Read the lines one at a time, in order, just like the computer does.',
      'Think about what y = x does: it uses the value that x holds at the moment that line runs.',
      'Trace it on paper: draw a box for x and a box for y, and update the boxes after every line. What is in the y box when print(y) runs?'
    ],
    explanation:
      'The line y = x copies the value 7 into y at that moment. When x is changed to 3 afterwards, y keeps its own copy, so print(y) shows 7.',
    revisit: 'How assignment copies a value at the moment the line runs'
  },
  {
    id: 2,
    concept: 'Fixing syntax errors',
    prompt: 'Python shows a SyntaxError for this code. What is the mistake?',
    code: 'age = 15\nif age >= 13\n    print("Teen")',
    optionStyle: 'text',
    options: [
      'The if line is missing a colon (:) at the end',
      'print should be written with a capital P',
      'The number 15 must be in quotes',
      'The print line should not be indented'
    ],
    correctIndex: 0,
    hints: [
      'Look closely at the end of the line that starts with if.',
      'Python needs a special symbol to show where the condition ends and the block begins.',
      'Compare this if line with a correct one, such as for i in range(3): and look at the very last character of each line.'
    ],
    explanation:
      'In Python, an if line must end with a colon. Without it, Python cannot tell where the condition ends and the indented block begins. The fixed line is: if age >= 13:',
    revisit: 'Colons and indentation after if, for, while and def'
  },
  {
    id: 3,
    concept: 'Conditionals and order of execution',
    prompt: 'What does this program print?',
    code: 'score = 4\nif score > 5:\n    print("High")\nscore = 9\nprint("Done")',
    optionStyle: 'code',
    options: ['High\nDone', 'High', 'Done', 'Nothing is printed'],
    correctIndex: 2,
    hints: [
      'Python runs the lines from top to bottom, one time.',
      'An if is checked only at the moment Python reaches it. Python does not go back up later.',
      'Write down the value of score at the moment the if line runs. Is score > 5 True or False then? Then follow the lines that come next, in order.'
    ],
    explanation:
      'When Python reaches the if line, score is 4, so score > 5 is False and print("High") is skipped. Setting score = 9 afterwards does not send Python back, so only Done is printed.',
    revisit: 'Programs run line by line, and an if is checked only when Python reaches it'
  },
  {
    id: 4,
    concept: 'Loops',
    prompt: 'What does this loop print?',
    code: 'for i in range(3):\n    print(i)',
    optionStyle: 'code',
    options: ['1\n2\n3', '0\n1\n2\n3', '3', '0\n1\n2'],
    correctIndex: 3,
    hints: [
      'The variable i takes a new value each time the loop repeats.',
      'range(3) decides how many times the loop runs and which values i takes.',
      'Python counts from a starting number and stops before the number in the brackets. Write out the values of i by hand, one per repeat.'
    ],
    explanation:
      'range(3) produces the numbers 0, 1 and 2: three values that start at 0 and stop just before 3. The loop runs once for each number, so it prints 0, 1 and 2 on separate lines.',
    revisit: 'How range() counts: it starts at 0 and stops before the end number'
  },
  {
    id: 5,
    concept: 'Giving precise instructions',
    prompt: 'A friend says: "Print the word Hello three times, each on its own line." Which code does exactly that?',
    code: '',
    optionStyle: 'code',
    options: [
      'print("Hello" * 3)',
      'for i in range(3):\n    print("Hello")',
      'for i in range(4):\n    print("Hello")',
      'print("Hello 3 times")'
    ],
    correctIndex: 1,
    hints: [
      'A computer does exactly what you write, not what you mean.',
      'You need to repeat a print. Each print starts a new line.',
      'For each option, count how many times print runs and whether the words end up on separate lines. Which one matches both parts of the request?'
    ],
    explanation:
      'A loop with range(3) runs its block exactly three times, and each print() starts a new line. print("Hello" * 3) puts HelloHelloHello on one line, the range(4) loop prints four times, and print("Hello 3 times") prints those exact words once.',
    revisit: 'Computers follow instructions exactly, so check what your code really does'
  }
];

/* ---------- 3. GAME STATE ---------- */
const state = {
  screen: 'welcome',   // 'welcome' | 'challenge' | 'results'
  currentIndex: 0,     // which challenge is showing (0 = first)
  score: 0,            // running total
  hintsUsed: 0,        // hints used on the current challenge
  answered: false,     // has the current challenge been answered?
  optionOrder: [],     // shown order of the options, as original positions
  results: []          // one entry per answered challenge
};

function resetState() {
  state.screen = 'welcome';
  state.currentIndex = 0;
  state.score = 0;
  state.hintsUsed = 0;
  state.answered = false;
  state.optionOrder = [];
  state.results = [];
}

/* ---------- 4. GAME LOGIC (no HTML in this section) ---------- */

/** Points for one challenge: 0 if wrong; otherwise reduced by hints. */
function calculatePoints(isCorrect, hintsUsed) {
  if (!isCorrect) return 0;
  const points = SETTINGS.pointsPerChallenge - SETTINGS.hintPenalty * hintsUsed;
  return Math.max(SETTINGS.minCorrectPoints, points);
}

/** Highest score possible in the whole game. */
function maxScore() {
  return CHALLENGES.length * SETTINGS.pointsPerChallenge;
}

/**
 * Returns the numbers 0..length-1 in random order (Fisher-Yates shuffle).
 * "random" can be replaced with a fixed function so tests are repeatable.
 */
function shuffledIndices(length, random) {
  const rand = random || Math.random;
  const order = [];
  for (let i = 0; i < length; i++) order.push(i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const temp = order[i];
    order[i] = order[j];
    order[j] = temp;
  }
  return order;
}

/** Checks the challenge data and returns a list of problems (empty = fine). */
function validateChallenges(list) {
  const problems = [];
  if (!Array.isArray(list) || list.length === 0) {
    return ['No challenges were found. Check the CHALLENGES list in script.js.'];
  }
  list.forEach((c, i) => {
    const name = 'Challenge ' + (i + 1);
    if (!c.prompt) problems.push(name + ' has no prompt.');
    if (c.optionStyle !== 'code' && c.optionStyle !== 'text') {
      problems.push(name + ' needs optionStyle to be "code" or "text".');
    }
    if (!Array.isArray(c.options) || c.options.length < 2) {
      problems.push(name + ' needs at least two options.');
    } else if (!Number.isInteger(c.correctIndex) || c.correctIndex < 0 || c.correctIndex >= c.options.length) {
      problems.push(name + ' has a correctIndex that does not match an option.');
    }
    if (!Array.isArray(c.hints) || c.hints.length !== SETTINGS.maxHints) {
      problems.push(name + ' needs exactly ' + SETTINGS.maxHints + ' hints.');
    }
    if (!c.explanation) problems.push(name + ' has no explanation.');
    if (!c.revisit) problems.push(name + ' has no revisit note.');
  });
  return problems;
}

/** A friendly message that matches the final score. */
function resultsMessage(score) {
  const share = score / maxScore();
  if (share === 1) return 'Perfect score with no hints! You really think like a Python programmer.';
  if (share >= 0.7) return 'Great work! You understand most of these ideas well.';
  if (share >= 0.4) return 'Good effort! Look at the topics below, then try again to beat your score.';
  return 'Every programmer starts somewhere. Read the topics below and have another go.';
}

function pluralise(count, word) {
  return count + ' ' + word + (count === 1 ? '' : 's');
}

/* ---------- 5. SCREEN RENDERING ---------- */
const els = {}; // filled in by init()

/** Creates an element with optional class and text (text is always safe). */
function makeEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function showScreen(name) {
  state.screen = name;
  els.welcome.hidden = name !== 'welcome';
  els.challenge.hidden = name !== 'challenge';
  els.results.hidden = name !== 'results';
  // The welcome screen is centred vertically; the other screens start at the top.
  els.app.classList.toggle('is-welcome', name === 'welcome');

  // Move keyboard / screen-reader focus to the new screen's heading.
  const heading = { welcome: els.welcomeTitle, challenge: els.challengeTitle, results: els.resultsTitle }[name];
  heading.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function updateStats() {
  const total = CHALLENGES.length;
  const number = state.currentIndex + 1;
  const completed = state.currentIndex + (state.answered ? 1 : 0);
  els.score.textContent = state.score;
  els.progressText.textContent = 'Challenge ' + number + ' of ' + total;
  els.progressBar.setAttribute('aria-valuemax', total);
  els.progressBar.setAttribute('aria-valuenow', completed);
  els.progressBar.setAttribute('aria-valuetext', 'Challenge ' + number + ' of ' + total);
  els.progressFill.style.width = (completed / total) * 100 + '%';
}

/**
 * Keeps the hint button and the hint text in step with the game:
 *  - before answering: "Show hint" / "Show another hint" / "All hints shown"
 *  - after answering: the button is hidden, because hints can no longer help
 */
function updateHintInfo() {
  const left = SETTINGS.maxHints - state.hintsUsed;
  const usedText = 'Hints used: ' + state.hintsUsed + ' of ' + SETTINGS.maxHints + '.';

  if (state.answered) {
    els.hintBtn.hidden = true;
    els.hintInfo.textContent = usedText;
    return;
  }

  els.hintBtn.hidden = false;
  if (state.hintsUsed === 0) {
    els.hintBtn.textContent = 'Show hint';
  } else if (left > 0) {
    els.hintBtn.textContent = 'Show another hint';
  } else {
    els.hintBtn.textContent = 'All hints shown';
  }
  els.hintBtn.setAttribute('aria-disabled', left === 0 ? 'true' : 'false');

  if (left === 0) {
    els.hintInfo.textContent = usedText + ' This challenge is now worth ' + calculatePoints(true, state.hintsUsed) + ' points.';
  } else {
    els.hintInfo.textContent =
      usedText + ' Each hint costs ' + SETTINGS.hintPenalty +
      ' points. This challenge is now worth ' + calculatePoints(true, state.hintsUsed) + ' points.';
  }
}

function renderChallenge() {
  const c = CHALLENGES[state.currentIndex];
  const total = CHALLENGES.length;
  state.hintsUsed = 0;
  state.answered = false;

  els.concept.textContent = c.concept;

  // Heading: a screen-reader-only "Challenge 2 of 5" prefix, then the question.
  els.challengeTitle.textContent = '';
  els.challengeTitle.appendChild(makeEl('span', 'sr-only', 'Challenge ' + (state.currentIndex + 1) + ' of ' + total + '. '));
  els.challengeTitle.appendChild(document.createTextNode(c.prompt));

  els.codeBlock.hidden = c.code === '';
  els.code.textContent = c.code;

  // Answer options: shuffled every time the challenge is shown.
  // Each radio button keeps the ORIGINAL position as its value, so scoring still
  // compares against c.correctIndex no matter how the options are arranged.
  state.optionOrder = shuffledIndices(c.options.length);
  els.options.textContent = '';
  els.options.classList.remove('locked');
  state.optionOrder.forEach((originalIndex, position) => {
    const label = makeEl('label', 'option');
    const input = makeEl('input');
    input.type = 'radio';
    input.name = 'answer';
    input.value = String(originalIndex);
    label.appendChild(input);
    label.appendChild(makeEl('span', 'option-letter', String.fromCharCode(65 + position)));
    label.appendChild(makeEl('span', c.optionStyle === 'code' ? 'option-text is-code' : 'option-text', c.options[originalIndex]));
    els.options.appendChild(label);
  });

  els.hints.textContent = '';
  els.formMessage.textContent = '';
  els.optionsSet.removeAttribute('aria-describedby');
  els.feedback.textContent = '';
  els.feedback.className = 'feedback';
  els.feedback.removeAttribute('aria-labelledby');
  els.feedback.removeAttribute('aria-describedby');
  els.feedback.hidden = true;
  els.submitBtn.hidden = false;
  els.nextBtn.hidden = true;

  updateHintInfo();
  updateStats();
  els.challengeTitle.focus({ preventScroll: true });
}

/** Colours and labels the options once the answer is submitted. */
function lockOptions(selectedIndex, correctIndex) {
  els.options.classList.add('locked');
  Array.from(els.options.children).forEach(label => {
    const input = label.querySelector('input');
    const originalIndex = Number(input.value);
    input.disabled = true;
    if (originalIndex === correctIndex) {
      label.classList.add('correct');
      label.appendChild(makeEl('span', 'option-badge', '\u2713 Correct answer'));
    } else if (originalIndex === selectedIndex) {
      label.classList.add('incorrect');
      label.appendChild(makeEl('span', 'option-badge', '\u2717 Your answer'));
    }
  });
}

/**
 * Builds the feedback box and moves focus into it. Focus (rather than a live region)
 * is what makes screen readers read the result once, clearly. The box is labelled by
 * its title and described by the explanation and points lines.
 */
function renderFeedback(isCorrect, points, challenge) {
  els.feedback.textContent = '';
  els.feedback.className = 'feedback ' + (isCorrect ? 'correct' : 'incorrect');

  const title = makeEl('p', 'feedback-title');
  title.id = 'feedback-title';
  title.appendChild(makeEl('span', '', isCorrect ? '\u2713 ' : '\u2717 '));
  title.appendChild(document.createTextNode(isCorrect ? 'Correct!' : 'Not quite.'));
  els.feedback.appendChild(title);

  const explanation = makeEl('p', '', challenge.explanation);
  explanation.id = 'feedback-explanation';
  els.feedback.appendChild(explanation);

  let pointsText;
  if (isCorrect) {
    pointsText = 'You earned ' + pluralise(points, 'point');
    if (state.hintsUsed > 0) pointsText += ' (' + pluralise(state.hintsUsed, 'hint') + ' used)';
    pointsText += '.';
  } else {
    pointsText = 'You earned 0 points this time. The correct answer is marked above.';
  }
  const pointsLine = makeEl('p', '', pointsText);
  pointsLine.id = 'feedback-points';
  els.feedback.appendChild(pointsLine);

  els.feedback.setAttribute('aria-labelledby', 'feedback-title');
  els.feedback.setAttribute('aria-describedby', 'feedback-explanation feedback-points');
  els.feedback.hidden = false;
}

function renderResults() {
  els.finalScore.textContent = state.score;
  els.maxScore.textContent = maxScore();
  els.resultsMessage.textContent = resultsMessage(state.score);

  els.resultsList.textContent = '';
  state.results.forEach((r, i) => {
    const item = makeEl('li', 'result-item ' + (r.correct ? 'correct' : 'incorrect'));
    item.appendChild(makeEl('span', 'result-name', (i + 1) + '. ' + r.concept));
    item.appendChild(makeEl('span', 'result-status', (r.correct ? '\u2713 Correct' : '\u2717 Incorrect') + ' \u2022 ' + r.points + ' pts'));
    item.appendChild(makeEl('p', 'result-meta', 'Hints used: ' + r.hintsUsed));
    els.resultsList.appendChild(item);
  });

  els.revisitList.textContent = '';
  const missed = state.results.filter(r => !r.correct);
  if (missed.length === 0) {
    els.revisitList.appendChild(makeEl('li', '', 'Nothing to revisit. Well done!'));
  } else {
    missed.forEach(r => els.revisitList.appendChild(makeEl('li', '', r.revisit)));
  }
}

/* ---------- 6. EVENT HANDLERS ---------- */
function startGame() {
  resetState();
  renderChallenge();
  showScreen('challenge');
}

function showHint() {
  if (state.answered || state.hintsUsed >= SETTINGS.maxHints) return; // ignore extra clicks
  const c = CHALLENGES[state.currentIndex];
  const item = makeEl('li');
  item.appendChild(makeEl('strong', '', 'Hint ' + (state.hintsUsed + 1) + ': '));
  item.appendChild(document.createTextNode(c.hints[state.hintsUsed]));
  els.hints.appendChild(item);
  state.hintsUsed += 1;
  updateHintInfo();
}

function submitAnswer(event) {
  event.preventDefault();
  if (state.answered) return; // stops double-clicks from scoring twice

  const chosen = els.options.querySelector('input[name="answer"]:checked');
  if (!chosen) {
    els.formMessage.textContent = 'Please choose an answer first.';
    els.optionsSet.setAttribute('aria-describedby', 'form-message');
    const first = els.options.querySelector('input');
    if (first) first.focus();
    return;
  }
  els.formMessage.textContent = '';
  els.optionsSet.removeAttribute('aria-describedby');

  const c = CHALLENGES[state.currentIndex];
  const selectedIndex = Number(chosen.value); // original position, not screen position
  const isCorrect = selectedIndex === c.correctIndex;
  const points = calculatePoints(isCorrect, state.hintsUsed);

  state.answered = true;
  state.score += points;
  state.results.push({
    id: c.id,
    concept: c.concept,
    revisit: c.revisit,
    correct: isCorrect,
    hintsUsed: state.hintsUsed,
    points: points
  });

  lockOptions(selectedIndex, c.correctIndex);
  updateHintInfo();
  updateStats();

  // Small "bump" animation on the score (skipped automatically if the user prefers less motion).
  els.score.classList.remove('bump');
  void els.score.offsetWidth;
  if (points > 0) els.score.classList.add('bump');

  const isLast = state.currentIndex === CHALLENGES.length - 1;
  els.nextBtn.textContent = isLast ? 'See my results' : 'Next challenge';
  els.submitBtn.hidden = true;
  els.nextBtn.hidden = false;

  // Build the feedback and move focus to it, so screen readers read the result.
  // The "Next" button is the next Tab stop after it.
  renderFeedback(isCorrect, points, c);
  els.feedback.focus();
}

function nextChallenge() {
  if (!state.answered) return;
  if (state.currentIndex < CHALLENGES.length - 1) {
    state.currentIndex += 1;
    renderChallenge();
    window.scrollTo(0, 0);
  } else {
    renderResults();
    showScreen('results');
  }
}

function restartGame() {
  resetState();
  showScreen('welcome');
}

/** Highlights the chosen option (works in every browser). */
function onOptionChange() {
  Array.from(els.options.children).forEach(label => {
    label.classList.toggle('selected', label.querySelector('input').checked);
  });
}

/* ---------- 7. START-UP ---------- */
function init() {
  const ids = {
    app: 'main',
    welcome: 'screen-welcome', challenge: 'screen-challenge', results: 'screen-results',
    welcomeTitle: 'welcome-title', challengeTitle: 'challenge-title', resultsTitle: 'results-title',
    startBtn: 'start-btn', loadError: 'load-error',
    chipChallenges: 'chip-challenges', chipHints: 'chip-hints', chipPoints: 'chip-points',
    score: 'score', progressText: 'progress-text', progressBar: 'progress', progressFill: 'progress-fill',
    concept: 'concept', codeBlock: 'code-block', code: 'code',
    answerForm: 'answer-form', optionsSet: 'options-set', options: 'options', formMessage: 'form-message',
    hintBtn: 'hint-btn', hintInfo: 'hint-info', hints: 'hints',
    submitBtn: 'submit-btn', feedback: 'feedback', nextBtn: 'next-btn',
    finalScore: 'final-score', maxScore: 'max-score', resultsMessage: 'results-message',
    resultsList: 'results-list', revisitList: 'revisit-list', restartBtn: 'restart-btn'
  };
  Object.keys(ids).forEach(key => { els[key] = document.getElementById(ids[key]); });

  // Stop early with a clear message if the challenge data is missing or has a mistake.
  const problems = validateChallenges(CHALLENGES);
  if (problems.length > 0) {
    console.error('CodeQuest challenge data problems:\n' + problems.join('\n'));
    els.loadError.textContent = 'Sorry, the game could not load its challenges. Please tell your teacher.';
    els.loadError.hidden = false;
    els.startBtn.disabled = true;
    return;
  }

  // Show the real numbers on the welcome page.
  els.chipChallenges.textContent = CHALLENGES.length;
  els.chipHints.textContent = SETTINGS.maxHints;
  els.chipPoints.textContent = maxScore();

  els.startBtn.addEventListener('click', startGame);
  els.hintBtn.addEventListener('click', showHint);
  els.answerForm.addEventListener('submit', submitAnswer);
  els.options.addEventListener('change', onOptionChange);
  els.nextBtn.addEventListener('click', nextChallenge);
  els.restartBtn.addEventListener('click', restartGame);
}

// Run in the browser. (In Node, used for testing, there is no document.)
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}

// Lets the test scripts load the pure functions and data.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SETTINGS, CHALLENGES, calculatePoints, maxScore, shuffledIndices, validateChallenges, resultsMessage };
}