'use client';

export function DataCitation({ datasets }: { datasets?: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-[#f8f4e4] border border-[#e8e0cc] mt-8">
      <span className="material-symbols-outlined text-[#1c1c13]/30 text-lg mt-0.5 shrink-0">info</span>
      <div className="text-[11px] text-[#1c1c13]/50 leading-relaxed">
        <p>
          {datasets ? `${datasets} sourced` : 'Data sourced'} from{' '}
          <a
            href="https://github.com/qhspencer/lds-data-analysis"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1B5E7B] hover:underline font-bold"
          >
            qhspencer/lds-data-analysis
          </a>
          {' '}by Quinn Spencer. Licensed under the project&apos;s original terms.
        </p>
      </div>
    </div>
  );
}
