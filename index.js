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
  codioIDE.coachBot.register("hintButton", "Provide a hint on what to do next", onButtonPress)

  async function onButtonPress() {
    // Function that automatically collects all available context 
    let context = await codioIDE.coachBot.getContext()
    
    const userPrompt = `Here is the description of the programming assignment:

<assignment>
${context.guidesPage.content}
</assignment>

Here is the student's current code:

<current_code>
${context.files[0]}
</current_code> 

If <assignment> and <code> are empty, assume that they're not available. 

Provide a helpful hint that guides the student toward understanding without revealing the solution.
Start with a general hint. Phrase your hint in a way that encourages critical thinking and problem-solving.`

    const result = await codioIDE.coachBot.ask({
      systemPrompt: systemPrompt,
      messages: [{"role": "user", "content": userPrompt}]
    })
  }

})(window.codioIDE, window)
