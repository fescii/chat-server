// validate email using regex
const validateEmail = email => {
	const re = /\S+@\S+\.\S+/;
	return re.test(email);
}

// validate phone number using regex of all countries
const validatePhone = phone => {
	const re = /^\+(?:[0-9] ?){6,14}[0-9]$/;
	return re.test(phone);
}

// validate name
const validateName = name => {
	// name should min of 2 names and max of 3 names
	const names = name.trim().split(' ');
	
	if (names.length < 2 || names.length > 3) {
		return false;
	}
}

// validate dob using date
const validateDob = dob => {
	const dateOfBirth = new Date(dob);
	const currentDate = new Date();
	
	// check if the user is under 18 years old
	if (dateOfBirth.getFullYear() > currentDate.getFullYear() - 18) {
		return false;
	}
}

// Sanitize function to sanitize form fields: sanitize(string)
const sanitize = value => {
	// Remove possible trailing and leading white spaces
	value = value.trim();
	
	// Escape HTML special characters to prevent XSS
	const escapeHtml = str =>
		str.replace(/[&<>"']/g, match => {
			switch (match) {
				case '&': return '&amp;';
				case '<': return '&lt;';
				case '>': return '&gt;';
				case '"': return '&quot;';
				case "'": return '&#39;';
				default: return match;
			}
		});
	
	// Return sanitized value
	return escapeHtml(value);
};

// validate function to validate form fields
const validate = (values, schema) => {
	for (const key in schema) {
		const rule = schema[key];
		const keyStr = key.toString();
		if (rule.required ){
			if (values[key] === undefined || values[key] === null || values[key] === ''){
				throw new Error(`${key} is required`);
			}
		}
		
		if(rule.type === 'boolean' && typeof values[key] !== 'boolean') {
			throw new Error(`${key} should be a boolean`);
		}
		
		if (rule.type === 'string'){
			if(typeof values[key] !== 'string') {
				throw new Error(`${key} should be a string`);
			} else {
				// sanitize string
				values[key] = sanitize(values[key]);
			}
		}
		
		if (rule.maxLength && values[key].length > rule.maxLength) {
			throw new Error(`${key} should not be more than ${rule.maxLength} characters`);
		}
		
		if (rule.minLength && values[key].length < rule.minLength) {
			throw new Error(`${key} should not be less than ${rule.minLength} characters`);
		}
		
		if (rule.maxValue && values[key] > rule.maxValue) {
			throw new Error(`${key} should not be more than ${rule.maxValue}`);
		}
		
		if (rule.minValue && values[key] < rule.minValue) {
			throw new Error(`${key} should not be less than ${rule.minValue}`);
		}
		
		// check and validate email
		if (keyStr === 'email') {
			if (!validateEmail(values[key])) {
				throw new Error('Email is not valid');
			}
		}
		
		// check and validate dob
		if (keyStr === 'dob') {
			if (validateDob(values[key])) {
				throw new Error('You must be 18 years and above');
			}
		}
		
		// check and validate phone number
		if (keyStr === 'phone') {
			if (!validatePhone(values[key])) {
				throw new Error('Phone number is not valid');
			}
		}
		
		// check enum values
		if (rule.enum && !rule.enum.includes(values[key])) {
			throw new Error(`${key} should be one of ${rule.enum.join(', ')}`);
		}
	}
	
	// return sanitized values: object
	return values;
}

// export functions
module.exports = {
	validate,
	sanitize
}