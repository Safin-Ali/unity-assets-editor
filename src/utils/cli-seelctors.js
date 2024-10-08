export const selectors = [
	{
		message: 'Choose Operation',
		choices: [
			{
				name: 'Increase Skin Slots',
				value: 'iss'
			}
		]
	},
]

export const validators = [
	{
		name:'validateInteger',
		cb:(input) => {
			if(isNaN(input)) {
				console.error('\nplease provide number');
				return false;
			}
			 return true
		}
	}
]