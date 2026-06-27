import { useState } from 'react'
import type { FartLog } from '../types'
import { TACTICS, METHANE_LEVEL_HINT, getSmellStrengthLabel, formatFartLocation } from '../lib/constants'
import { getMethaneLevel } from '../lib/methaneConcentration'
import { formatDateTime } from '../lib/geo'
import './LogDetailModal.css'

interface Props {
  log: FartLog
  onClose: () => void
}

export function LogDetailModal({ log, onClose }: Props) {
  const [tacticHelp, setTacticHelp] = useState<string | null>(null)

  const displayGender = log.hideGender ? '非公開' : (log.gender ?? '—')
  const displayAge = log.hideAge ? '非公開' : (log.ageDisplay ?? '—')
  const methaneLevel = getMethaneLevel(log)

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="log-detail-title"
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="閉じる">
          ×
        </button>
        <a className="modal-report" href={`/contact?type=report&id=${log.id}`}>
          通報
        </a>

        <div className="modal-header">
          <span className={`badge badge-${log.source}`}>
            {log.source === 'ai' ? 'AI' : 'ユーザー'}
          </span>
          <h2 id="log-detail-title">メタン情報</h2>
        </div>

        <dl className="detail-list">
          <div>
            <dt>名前</dt>
            <dd>
              {log.nickname}
              {log.entityType === 'animal' &&
                log.animalSpecies &&
                log.animalSpecies !== log.nickname && (
                <span className="sub">（{log.animalSpecies}）</span>
              )}
            </dd>
          </div>
          {log.entityType === 'human' && (
            <>
              <div>
                <dt>性別</dt>
                <dd>{displayGender}</dd>
              </div>
              <div>
                <dt>年齢</dt>
                <dd>{displayAge}</dd>
              </div>
            </>
          )}
          <div>
            <dt>日時</dt>
            <dd>{formatDateTime(log.loggedAt)}</dd>
          </div>
          <div>
            <dt>主成分</dt>
            <dd>{log.mainComponent}</dd>
          </div>
          <div>
            <dt>放屁場所</dt>
            <dd>{formatFartLocation(log.fartLocation, log.fartLocationOther)}</dd>
          </div>
          <div>
            <dt>匂い</dt>
            <dd>
              {log.smellType}
              <span className="sub">匂いの強さ: {getSmellStrengthLabel(log.smellIntensity)}</span>
            </dd>
          </div>
          <div>
            <dt>音</dt>
            <dd>{log.soundText}</dd>
          </div>
          <div>
            <dt>バレ度</dt>
            <dd>{log.bustedCount}人</dd>
          </div>
          {log.tactics.length > 0 && (
            <div>
              <dt>戦術</dt>
              <dd className="tactics">
                {log.tactics.map((id) => (
                  <button
                    key={id}
                    type="button"
                    className="tactic-chip"
                    onClick={() => setTacticHelp(TACTICS[id].description)}
                  >
                    {TACTICS[id].label}
                  </button>
                ))}
              </dd>
            </div>
          )}
          {log.releaseSpeedKmh != null && (
            <div>
              <dt>放出速度</dt>
              <dd>
                時速{log.releaseSpeedKmh}km
                {log.releaseSpeedComparison && (
                  <span className="sub">（{log.releaseSpeedComparison}）</span>
                )}
              </dd>
            </div>
          )}
          <div>
            <dt>メタンレベル</dt>
            <dd>
              {methaneLevel}
              <span className="sub">{METHANE_LEVEL_HINT}</span>
              {log.source === 'user' && (
                <span className="sub">投稿内容から推定</span>
              )}
            </dd>
          </div>
          {log.socialImpact && (
            <div>
              <dt>社会的影響度</dt>
              <dd>{log.socialImpact}</dd>
            </div>
          )}
        </dl>

        {tacticHelp && (
          <div className="tactic-popup">
            <p>{tacticHelp}</p>
            <button type="button" className="btn btn-small" onClick={() => setTacticHelp(null)}>
              閉じる
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
