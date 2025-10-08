/**
 * コードフォーマット用ユーティリティ
 * 得意先コード（6桁）と作業コード（5桁）のゼロパディング処理
 */

/**
 * 得意先コードを6桁の数字にフォーマット（ゼロパディング）
 * @param {string|number} code - 得意先コード
 * @returns {string} 6桁にゼロパディングされたコード
 */
export const formatCustomerCode = (code) => {
  if (!code) return '';
  
  // 数字のみを抽出
  const numericCode = String(code).replace(/\D/g, '');
  
  // 6桁にゼロパディング
  return numericCode.padStart(6, '0');
};

/**
 * 作業コードを5桁の数字にフォーマット（ゼロパディング）
 * @param {string|number} code - 作業コード
 * @returns {string} 5桁にゼロパディングされたコード
 */
export const formatWorkCode = (code) => {
  if (!code) return '';
  
  // 数字のみを抽出
  const numericCode = String(code).replace(/\D/g, '');
  
  // 5桁にゼロパディング
  return numericCode.padStart(5, '0');
};

/**
 * 得意先コードの妥当性をチェック
 * @param {string} code - チェックするコード
 * @returns {object} バリデーション結果
 */
export const validateCustomerCode = (code) => {
  const formatted = formatCustomerCode(code);
  const isValid = /^\d{6}$/.test(formatted);
  
  return {
    isValid,
    formatted,
    error: isValid ? null : '得意先コードは6桁の数字で入力してください'
  };
};

/**
 * 作業コードの妥当性をチェック
 * @param {string} code - チェックするコード
 * @returns {object} バリデーション結果
 */
export const validateWorkCode = (code) => {
  const formatted = formatWorkCode(code);
  const isValid = /^\d{5}$/.test(formatted);
  
  return {
    isValid,
    formatted,
    error: isValid ? null : '作業コードは5桁の数字で入力してください'
  };
};

/**
 * CSVデータのコードフィールドを一括フォーマット
 * @param {Array} records - CSVレコードの配列
 * @returns {Array} フォーマット後のレコード配列
 */
export const formatCsvCodes = (records) => {
  if (!Array.isArray(records)) {
    console.error('formatCsvCodes: recordsが配列ではありません', records);
    return records;
  }
  
  return records.map(record => {
    if (!record || typeof record !== 'object') {
      return record;
    }
    
    const formattedRecord = { ...record };
    
    // 得意先コードのフォーマット
    if (record.customerId || record.customerCode) {
      try {
        formattedRecord.customerId = formatCustomerCode(record.customerId || record.customerCode);
      } catch (error) {
        console.error('得意先コードフォーマットエラー:', error, record.customerId || record.customerCode);
      }
    }
    
    // 作業コードのフォーマット
    if (record.workCode) {
      try {
        formattedRecord.workCode = formatWorkCode(record.workCode);
      } catch (error) {
        console.error('作業コードフォーマットエラー:', error, record.workCode);
      }
    }
    
    return formattedRecord;
  });
};

/**
 * 次の作業コードを生成（既存の最大値+1）
 * @param {Array} existingCodes - 既存の作業コード配列
 * @returns {string} 次の作業コード（5桁）
 */
export const generateNextWorkCode = (existingCodes = []) => {
  if (existingCodes.length === 0) {
    return '00001';
  }

  // 数値に変換して最大値を取得
  const maxCode = Math.max(
    ...existingCodes.map(code => parseInt(formatWorkCode(code), 10))
  );

  // 最大値+1を5桁でフォーマット
  return formatWorkCode(maxCode + 1);
};

/**
 * コードフォーマット用のヘルパー関数
 */
export const codeHelpers = {
  // サンプルコード生成
  generateSampleCustomerCode: () => formatCustomerCode(1),
  generateSampleWorkCode: () => formatWorkCode(1),

  // コード範囲チェック
  isValidCustomerCodeRange: (code) => {
    const num = parseInt(formatCustomerCode(code), 10);
    return num >= 1 && num <= 999999;
  },

  isValidWorkCodeRange: (code) => {
    const num = parseInt(formatWorkCode(code), 10);
    return num >= 1 && num <= 99999;
  }
};