import { useReadContract, useWriteContract } from 'wagmi';
import { useMemo } from 'react';
import { ComplianceHubABI } from '@/constants/abi';

export const useContract = () => {
  const contractConfig = useMemo(() => {
    if (!process.env.NEXT_PUBLIC_CONTRACT_ADDRESS) {
      return null;
    }

    return {
      address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
      abi: ComplianceHubABI,
    };
  }, []);

  // Write contract hook
  const writeContract = useWriteContract();

  // Read methods as functions that return hooks
  const getUserAnalyses = (address: string) => useReadContract({
    ...(contractConfig || {}),
    functionName: 'get_user_analyses',
    args: [address],
    query: {
      enabled: !!address && !!contractConfig,
    },
  });

  const getUserComparisons = (address: string) => useReadContract({
    ...(contractConfig || {}),
    functionName: 'get_user_comparisons',
    args: [address],
    query: {
      enabled: !!address && !!contractConfig,
    },
  });

  const getUserBenchmarks = (address: string) => useReadContract({
    ...(contractConfig || {}),
    functionName: 'get_user_benchmarks',
    args: [address],
    query: {
      enabled: !!address && !!contractConfig,
    },
  });

  const getUserAuditTrail = (address: string) => useReadContract({
    ...(contractConfig || {}),
    functionName: 'get_user_audit_trail',
    args: [address],
    query: {
      enabled: !!address && !!contractConfig,
    },
  });

  return {
    write: {
      analyze_policy: async (args: [string, string]) => {
        if (!contractConfig) throw new Error('Contract not configured');
        return await writeContract.writeContractAsync({
          ...contractConfig,
          functionName: 'analyze_policy',
          args,
        });
      },
      compare_policies: async (args: [string, string]) => {
        if (!contractConfig) throw new Error('Contract not configured');
        return await writeContract.writeContractAsync({
          ...contractConfig,
          functionName: 'compare_policies',
          args,
        });
      },
      benchmark_against_standard: async (args: [string, string]) => {
        if (!contractConfig) throw new Error('Contract not configured');
        return await writeContract.writeContractAsync({
          ...contractConfig,
          functionName: 'benchmark_against_standard',
          args,
        });
      },
      generate_compliance_report: async (args: []) => {
        if (!contractConfig) throw new Error('Contract not configured');
        return await writeContract.writeContractAsync({
          ...contractConfig,
          functionName: 'generate_compliance_report',
          args,
        });
      },
    },
    read: {
      get_user_analyses: getUserAnalyses,
      get_user_comparisons: getUserComparisons,
      get_user_benchmarks: getUserBenchmarks,
      get_user_audit_trail: getUserAuditTrail,
    },
  };
};
