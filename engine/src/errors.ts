/** Kody błędów silnika. LAYER_LIMIT ma ten sam kod co backend (errors.layerLimit we frontendzie). */
export type EngineErrorCode = 'LAYER_LIMIT' | 'LAYER_NOT_FOUND';

/** Błąd rzucany przez silnik. Frontend łapie go i pokazuje komunikat po kodzie. */
export class EngineError extends Error {
    readonly code: EngineErrorCode;

    constructor(code: EngineErrorCode) {
        super(code);
        this.name = 'EngineError';
        this.code = code;
    }
}