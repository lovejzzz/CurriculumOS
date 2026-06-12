import type { GenomeShard } from '../types.ts';

export const cs: GenomeShard = {
  id: 'cs',
  discipline: 'cs',
  concepts: [
    {
      key: 'cs/variables-types',
      name: 'Variables and types',
      aliases: ['variables', 'expressions and types', 'variables, expressions, and types'],
      requires: [],
      definition:
        'A variable is a name bound to a value; its type determines what operations make sense and how the value behaves.',
      misconceptions: [
        {
          claim: 'A variable is a box that holds a value permanently.',
          correction:
            'In Python a variable is a label bound to an object; assignment rebinds the label and never copies the object.',
        },
      ],
      workedExample: {
        setup: 'x = 3; y = x; x = x + 1 — what is y?',
        steps: ['y = x binds y to the same value 3.', 'x = x + 1 rebinds x to a new object 4; y is untouched.'],
        answer: 'y is 3; rebinding x does not change y.',
      },
      citations: [{ title: 'CurriculumOS genome: variables and types', source: 'genome', externalId: 'cs/variables-types' }],
    },
    {
      key: 'cs/conditionals',
      name: 'Conditionals and boolean logic',
      aliases: ['conditionals', 'boolean logic', 'if statements'],
      requires: ['cs/variables-types'],
      definition:
        'Conditionals branch execution on boolean expressions; complex conditions compose with and, or, and not under short-circuit evaluation.',
      misconceptions: [
        {
          claim: 'elif chains and separate if statements are interchangeable.',
          correction:
            'A chain picks exactly one branch; separate ifs can fire several — switching them silently changes which code runs.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: conditionals', source: 'genome', externalId: 'cs/conditionals' }],
    },
    {
      key: 'cs/while-loops',
      name: 'While loops',
      aliases: ['while loop', 'indefinite iteration'],
      requires: ['cs/conditionals'],
      definition:
        'A while loop repeats its body as long as a condition holds; correctness depends on the body making progress toward the condition failing.',
      misconceptions: [
        {
          claim: 'The loop condition is re-checked continuously while the body runs.',
          correction: 'The condition is tested only between iterations — a body can momentarily violate it without exiting.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: while loops', source: 'genome', externalId: 'cs/while-loops' }],
    },
    {
      key: 'cs/for-loops',
      name: 'For loops and range',
      aliases: ['for loops', 'for loop', 'range', 'definite iteration'],
      requires: ['cs/while-loops'],
      definition:
        'A for loop iterates over the items a sequence yields; range(a, b) yields a up to but not including b.',
      misconceptions: [
        {
          claim: 'range(1, 10) includes 10.',
          correction: 'range is half-open: it stops before the end value, so range(1, 10) yields 1 through 9.',
        },
      ],
      workedExample: {
        setup: 'total = 0; for i in range(1, 5): total += i',
        steps: ['range(1, 5) yields 1, 2, 3, 4.', 'Sum accumulates 1+2+3+4.'],
        answer: 'total is 10 (range excludes 5).',
      },
      citations: [{ title: 'CurriculumOS genome: for loops and range', source: 'genome', externalId: 'cs/for-loops' }],
    },
    {
      key: 'cs/functions',
      name: 'Functions and scope',
      aliases: ['functions', 'scope', 'parameters and return'],
      requires: ['cs/variables-types'],
      definition:
        'A function packages a computation behind parameters and a return value; names assigned inside it live in a local scope that vanishes on return.',
      misconceptions: [
        {
          claim: 'Printing a value and returning it are the same.',
          correction:
            'print sends text to the screen and returns None; only return hands a value back for the caller to use.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: functions and scope', source: 'genome', externalId: 'cs/functions' }],
    },
    {
      key: 'cs/lists',
      name: 'Lists',
      aliases: ['list operations', 'arrays'],
      requires: ['cs/for-loops'],
      definition:
        'A list is a mutable ordered sequence; indexing is zero-based and slicing returns a new list without touching the original.',
      misconceptions: [
        {
          claim: 'Assigning a list to a new variable copies it.',
          correction:
            'Assignment shares the same list object — mutations through either name are visible to both; copy explicitly when you need independence.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: lists', source: 'genome', externalId: 'cs/lists' }],
    },
    {
      key: 'cs/strings',
      name: 'Strings and text processing',
      aliases: ['strings', 'text processing', 'string methods'],
      requires: ['cs/lists'],
      definition:
        'Strings are immutable character sequences; every method that seems to modify one actually returns a new string.',
      misconceptions: [
        {
          claim: 's.upper() changes s.',
          correction: 'Strings are immutable — s.upper() returns a new string you must assign or it is lost.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: strings', source: 'genome', externalId: 'cs/strings' }],
    },
    {
      key: 'cs/dictionaries',
      name: 'Dictionaries and nested data',
      aliases: ['dictionaries', 'dicts', 'nested data', 'key-value'],
      requires: ['cs/lists'],
      definition:
        'A dictionary maps keys to values for constant-time lookup; nesting dicts and lists models structured records.',
      misconceptions: [
        {
          claim: 'Looking up a missing key returns None.',
          correction: 'Bracket lookup raises KeyError; use .get() when absence is an expected case.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: dictionaries', source: 'genome', externalId: 'cs/dictionaries' }],
    },
    {
      key: 'cs/file-io',
      name: 'File input and output',
      aliases: ['file io', 'file input/output', 'reading and writing files'],
      requires: ['cs/strings'],
      definition:
        'File I/O streams text between program and disk; the with statement guarantees the file closes even when the body raises.',
      misconceptions: [
        {
          claim: 'Reading a file yields numbers when the file contains numbers.',
          correction: 'Files yield strings — "42\\n" needs stripping and conversion before arithmetic.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: file I/O', source: 'genome', externalId: 'cs/file-io' }],
    },
    {
      key: 'cs/recursion',
      name: 'Recursion',
      aliases: ['recursive functions'],
      requires: ['cs/functions'],
      definition:
        'A recursive function solves a problem by calling itself on smaller inputs, anchored by a base case that returns without recursing.',
      misconceptions: [
        {
          claim: 'Recursion is just a loop written strangely.',
          correction:
            'Each call gets its own frame and locals — state lives on the call stack, which is exactly what makes tree-shaped problems natural.',
        },
      ],
      workedExample: {
        setup: 'factorial(4) with factorial(n) = 1 if n <= 1 else n * factorial(n - 1)',
        steps: ['factorial(4) = 4 × factorial(3)', 'unwinds through 3 × 2 × factorial(1)', 'base case returns 1.'],
        answer: '24',
      },
      citations: [{ title: 'CurriculumOS genome: recursion', source: 'genome', externalId: 'cs/recursion' }],
    },
    {
      key: 'cs/classes-objects',
      name: 'Classes and objects',
      aliases: ['classes', 'objects', 'object-oriented programming'],
      requires: ['cs/functions', 'cs/dictionaries'],
      definition:
        'A class bundles data (attributes) with behavior (methods); each instance carries its own state while sharing the class’s methods.',
      misconceptions: [
        {
          claim: 'self is a keyword Python fills in by magic.',
          correction:
            'self is just the first parameter — instance.method(x) is sugar for Class.method(instance, x).',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: classes and objects', source: 'genome', externalId: 'cs/classes-objects' }],
    },
    {
      key: 'cs/debugging-testing',
      name: 'Debugging and testing',
      aliases: ['debugging', 'testing', 'unit tests'],
      requires: ['cs/functions'],
      definition:
        'Debugging is hypothesis-driven: reproduce, isolate, fix, then keep a test that fails without the fix so the bug stays dead.',
      misconceptions: [
        {
          claim: 'A passing test suite means the code is correct.',
          correction: 'Tests prove presence of checked behavior, not absence of bugs — coverage of inputs you never wrote stays unknown.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: debugging and testing', source: 'genome', externalId: 'cs/debugging-testing' }],
    },
    {
      key: 'cs/algorithms',
      name: 'Introduction to algorithms',
      aliases: ['algorithms', 'algorithm analysis', 'complexity'],
      requires: ['cs/for-loops', 'cs/lists'],
      definition:
        'An algorithm is a finite, unambiguous procedure; comparing algorithms means comparing how their work grows with input size, not their wall-clock on one machine.',
      misconceptions: [
        {
          claim: 'The faster-running program always has the better algorithm.',
          correction:
            'Constant factors and small inputs hide growth rates — linear search beats binary search on a five-item list and loses on a million.',
        },
      ],
      citations: [{ title: 'CurriculumOS genome: algorithms', source: 'genome', externalId: 'cs/algorithms' }],
    },
  ],
};
