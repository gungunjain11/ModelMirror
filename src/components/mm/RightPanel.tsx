import { useApp, type RightTab } from '@/contexts/AppContext';
import { SuggestionsTab } from './tabs/SuggestionsTab';
import { ExplainTab } from './tabs/ExplainTab';
import { RefactorTab } from './tabs/RefactorTab';
import { TestsTab } from './tabs/TestsTab';
import { ChatTab } from './tabs/ChatTab';

const tabs: { id: RightTab; label: string }[] = [
  { id: 'suggestions', label: 'Suggestions' },
  { id: 'explain', label: 'Explain' },
  { id: 'refactor', label: 'Refactor' },
  { id: 'tests', label: 'Tests' },
  { id: 'chat', label: 'Chat' },
];

export function RightPanel() {
  const { rightTab, setRightTab } = useApp();

  return (
    <div className="w-[360px] shrink-0 border-l border-border bg-card flex flex-col h-full select-none">
      {/* Tab bar */}
      <div className="flex border-b border-border shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setRightTab(tab.id)}
            className={`flex-1 px-2 py-2 text-[11px] font-medium transition-colors ${
              rightTab === tab.id
                ? 'text-foreground border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {rightTab === 'suggestions' && <SuggestionsTab />}
        {rightTab === 'explain' && <ExplainTab />}
        {rightTab === 'refactor' && <RefactorTab />}
        {rightTab === 'tests' && <TestsTab />}
        {rightTab === 'chat' && <ChatTab />}
      </div>
    </div>
  );
}
