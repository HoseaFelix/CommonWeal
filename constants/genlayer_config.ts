export const GENLAYER_CONFIG = {
    // 1. Deploy your contract in GenLayer Studio
    // 2. Copy the Deployed Contract Address and paste it below
    CONTRACT_ADDRESS: "0x9091Db8986Fbc096d5eF4153cEDA1255a137F249",

    // 3. (Optional) If you have a specific ABI, you can add it here
    CHAIN_ID: 62255, // GenLayer Studio Chain ID (0xf22f)
    RPC_URL: "https://studio.genlayer.com/api"
};

// Contract method names for Policy Risk Analyzer
export const POLICY_METHODS = {
    ANALYZE_POLICY: 'analyze_policy',
    GET_ANALYSIS: 'get_analysis',
    GET_USER_ANALYSES: 'get_user_analyses',
    GET_ANALYSIS_COUNT: 'get_analysis_count',
    GET_LATEST_ANALYSIS_ID: 'get_latest_analysis_id',
};

// Policy configuration
export const POLICY_CONFIG = {
    MAX_CHARS: 5000, // Max characters for policy text
};
