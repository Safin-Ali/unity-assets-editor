export const selectors = [
	{
		message: "Choose Operation",
		choices: [
			{
				name: "Increase Skin Slots",
				value: "iss"
			}
		]
	},
]

export const validators = [
	{
		name:"validateInteger",
		cb:(input) => {
			if(isNaN(input)) {
				console.error("\nplease provide number");
				return false;
			}
			 return true
		}
	},
	{
		name:"validateIssLess100",
		cb:(input) => {
			if(isNaN(input)) {
				console.error("\nplease provide number");
				return false;
			}
			if(parseInt(input) > 99) {
				console.error("\nplease provide less 100 value")
				return false
			}
			 return true
		}
	}
]