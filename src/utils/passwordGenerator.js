/**
 * パスワード生成ユーティリティ
 */

/**
 * 7桁のアルファベット+数字のパスワードを自動生成
 * @returns {string} 生成されたパスワード
 */
export const generateCustomerPassword = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  
  for (let i = 0; i < 7; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    password += characters[randomIndex];
  }
  
  return password;
};

/**
 * パスワードの強度をチェック
 * @param {string} password チェックするパスワード
 * @returns {object} チェック結果
 */
export const validatePassword = (password) => {
  const hasAlpha = /[A-Z]/.test(password);
  const hasNumeric = /[0-9]/.test(password);
  const isValidLength = password.length === 7;
  
  return {
    isValid: hasAlpha && hasNumeric && isValidLength,
    hasAlpha,
    hasNumeric,
    isValidLength
  };
};

/**
 * 複数のパスワードを一括生成
 * @param {number} count 生成する個数
 * @returns {Array<string>} 生成されたパスワードの配列
 */
export const generateMultiplePasswords = (count) => {
  const passwords = [];
  const usedPasswords = new Set();
  
  while (passwords.length < count) {
    const password = generateCustomerPassword();
    if (!usedPasswords.has(password)) {
      passwords.push(password);
      usedPasswords.add(password);
    }
  }
  
  return passwords;
};