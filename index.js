// Wrapping the whole extension in a JS function and calling it immediately 
// (ensures all global variables set in this extension cannot be referenced outside its scope)
(async function(codioIDE, window) {
  
  // Refer to Anthropic's guide on system prompts: https://docs.anthropic.com/claude/docs/system-prompts
  const systemPrompt = `You are a helpful teaching assistant providing hints to students without giving away solutions.

You will be provided with the assignment instructions in the <assignment> tag and student code in the <current_code> tag.

When providing hints:
- Start with the most general hint possible
- Focus on guiding concepts rather than specific code
- Never provide direct solutions or complete code
- Use the Socratic method - ask guiding questions to help students think through the problem
- If showing example code:
  - Keep examples under 10 lines
  - Use different variable names than what's in the assignment
  - Focus on demonstrating a concept, not the solution
  - Add a comment '// Example concept only - not a solution'
- Be encouraging and positive in your tone
- Help students discover the answer themselves

Key guidelines:
- Do not write assignment code
- Do not complete code for students
- Do not provide direct solutions
- Focus on learning concepts
- Guide students to their own discoveries`
    
  codioIDE.onErrorState((isError, error) => {
    console.log('codioIDE.onErrorState', {isError, error})
    if (isError) {
      codioIDE.coachBot.showTooltip("Would you like a hint?", () => {
        codioIDE.coachBot.open({id: "hintButton", params: "tooltip"})
      })
    }
  })

  // register(id: unique button id, name: name of button visible in Coach, function: function to call when button is clicked) 
  codioIDE.coachBot.register("hintButton", "Give me a hint", onButtonPress)

  async function onButtonPress(params) {
    // Function that automatically collects all available context 
    let context = await codioIDE.coachBot.getContext()
    console.log(context)

    let input

    if (params == "tooltip") { 
      input = context.error.text
      codioIDE.coachBot.write(context.error.text, codioIDE.coachBot.MESSAGE_ROLES.USER)
    } else {
      try {
        input = await codioIDE.coachBot.input("What part of the assignment would you like a hint about?")
      }  catch (e) {
          if (e.message == "Cancelled") {
            codioIDE.coachBot.write("Feel free to ask for hints anytime!")
            codioIDE.coachBot.showMenu()
            return
          }
      }
    }
   
    console.log(input)
    const valPrompt = `<Instructions>

Please determine if the student's question or request is related to the current assignment and appropriate for a hint:

<text>
${input}
</text>

Output your final Yes or No answer in JSON format with the key 'answer'

Respond with Yes if:
- The question relates to understanding concepts
- The request is about assignment requirements
- The student is asking for guidance on approach
- The question is about programming concepts

Respond with No if:
- The student is asking for direct solutions
- The request is for complete code
- The question is unrelated to programming or the assignment
- The text is not a question or request for help

</Instructions>`

    const validation_result = await codioIDE.coachBot.ask({
        systemPrompt: "You are a helpful assistant.",
        userPrompt: valPrompt
    }, {stream:false, preventMenu: true})

    if (validation_result.result.includes("Yes")) {
        const userPrompt = `Here is the student's question or request:

<student_question>
${input}
</student_question>

Here is the description of the programming assignment:

<assignment>
${context.guidesPage.content}
</assignment>

Here is the student's current code:

<current_code>
${context.files[0]}
</current_code> 

If <assignment> and <code> are empty, assume that they're not available. 

Provide a helpful hint that guides the student toward understanding without revealing the solution.
Start with a general hint. If the student asks for more specific hints, still avoid giving away the answer.
Phrase your hint in a way that encourages critical thinking and problem-solving.`

      const result = await codioIDE.coachBot.ask({
        systemPrompt: systemPrompt,
        messages: [{"role": "user", "content": userPrompt}]
      })
    }
    else {
        codioIDE.coachBot.write("I can provide hints about programming concepts and assignment approaches, but I can't provide direct solutions. Try rephrasing your question to focus on understanding the concepts involved.")
        codioIDE.coachBot.showMenu()
    }
  }

})(window.codioIDE, window)
