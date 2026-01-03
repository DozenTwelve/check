import React from 'react';

export function MasterDataSummary({ factories, consumables, loadMasterData }) {
    return (
        <section className="card" style={{ '--delay': '120ms' }}>
            <h2>Quick Context</h2>
            <p className="subtitle">
                Master data pulled from the database. Reload after inserting new factories or consumables.
            </p>
            <div className="row">
                <div>
                    <div className="tag">Factories</div>
                    <p>{factories.length} available</p>
                </div>
                <div>
                    <div className="tag">Consumables</div>
                    <p>{consumables.length} available</p>
                </div>
            </div>
            <button className="button ghost" type="button" onClick={loadMasterData}>
                Refresh Master Data
            </button>
        </section>
    );
}
