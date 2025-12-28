"use client";

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { CHAIN_CONFIGS } from '../utils/wallet-config';
import { Chain } from '../types';

interface ChainSelectorProps {
  onSelectChain: (chain: Chain) => void;
  disabled?: boolean;
}

export default function ChainSelector({ onSelectChain, disabled = false }: ChainSelectorProps) {
  const chains: Array<'ethereum' | 'solana' | 'bitcoin' | 'movement' | 'casper'> = ['ethereum', 'solana', 'bitcoin', 'movement', 'casper'];

  return (
    <div className="space-y-3">
      {chains.map((chain) => {
        const config = CHAIN_CONFIGS[chain];

        return (
          <Button
            key={chain}
            variant="outline"
            className="w-full flex items-center justify-start h-14 px-4 hover:border-primary hover:text-primary bg-transparent"
            onClick={() => onSelectChain(chain)}
            disabled={disabled}
          >
            <div className="w-8 h-8 mr-3 relative">
              <Image
                src={config.icon}
                alt={config.name}
                fill
                className="object-contain"
              />
            </div>
            <div className="text-left">
              <div className="font-medium">{config.name}</div>
              <div className="text-xs text-muted-foreground">{config.description}</div>
            </div>
          </Button>
        );
      })}
    </div>
  );
}
