import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

export function MasterDataSummary({ factories, consumables, loadMasterData }) {
    const { t } = useTranslation();

    return (
        <section className="card" style={{ '--delay': '120ms' }}>
            <h2>{t('components.master_data.title')}</h2>
            <p className="subtitle">
                {t('components.master_data.subtitle')}
            </p>
            <div className="row">
                <div>
                    <div className="tag">{t('components.master_data.tag_factories')}</div>
                    <p>{factories.length} {t('components.master_data.available')}</p>
                </div>
                <div>
                    <div className="tag">{t('components.master_data.tag_consumables')}</div>
                    <p>{consumables.length} {t('components.master_data.available')}</p>
                </div>
            </div>
            <button className="button ghost" type="button" onClick={loadMasterData}>
                {t('components.master_data.refresh')}
            </button>
        </section>
    );
}
