
import React, { useState, useCallback, useEffect } from 'react';
import { DetectorMode } from './types';
import { detectAiText, detectAiImage } from './services/geminiService';
import { RobotIcon, HumanIcon, UploadIcon } from './components/icons';
import Spinner from './components/Spinner';

// Header Component
const Header: React.FC = () => (
    <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            Detector de Contenido IA
        </h1>
        <p className="text-slate-400 mt-2 max-w-2xl mx-auto">
            Una herramienta para la integridad académica. Analiza texto o imágenes para verificar si fueron generados por una inteligencia artificial.
        </p>
    </header>
);

// TabButton Component
interface TabButtonProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
}
const TabButton: React.FC<TabButtonProps> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-6 py-2 rounded-md font-medium transition-all duration-300 ${isActive ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
    >
        {label}
    </button>
);

// ResultDisplay Component
interface ResultDisplayProps {
    isAi: boolean;
}
const ResultDisplay: React.FC<ResultDisplayProps> = ({ isAi }) => {
    const resultConfig = isAi
        ? {
            title: "SÍ",
            text: "Este contenido parece haber sido generado por IA.",
            Icon: RobotIcon,
            colors: "bg-yellow-500/10 border-yellow-500/50 text-yellow-300",
            iconColors: "text-yellow-400"
        }
        : {
            title: "NO",
            text: "Este contenido parece ser de origen humano.",
            Icon: HumanIcon,
            colors: "bg-green-500/10 border-green-500/50 text-green-300",
            iconColors: "text-green-400"
        };

    return (
        <div className={`mt-6 p-6 rounded-lg border flex flex-col items-center text-center transition-all duration-500 ${resultConfig.colors}`}>
            <resultConfig.Icon className={`w-16 h-16 mb-4 ${resultConfig.iconColors}`} />
            <p className="text-slate-300 text-sm">Contenido generado por IA:</p>
            <p className="text-5xl font-bold mt-1">{resultConfig.title}</p>
            <p className="mt-4 text-sm">{resultConfig.text}</p>
        </div>
    );
};


const App: React.FC = () => {
    const [mode, setMode] = useState<DetectorMode>(DetectorMode.Text);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [result, setResult] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [inputText, setInputText] = useState<string>('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        // Cleanup for image preview URL
        return () => {
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    const resetState = useCallback(() => {
        setIsLoading(false);
        setError(null);
        setResult(null);
    }, []);

    const handleModeChange = (newMode: DetectorMode) => {
        setMode(newMode);
        resetState();
        setInputText('');
        setImageFile(null);
        setImagePreview(null);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            resetState();
            setImageFile(file);
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
            setImagePreview(URL.createObjectURL(file));
        }
    };
    
    const handleAnalyse = async () => {
        resetState();
        setIsLoading(true);

        try {
            let detectionResult: boolean;
            if (mode === DetectorMode.Text) {
                if (!inputText.trim()) {
                    setError('Por favor, introduce algún texto para analizar.');
                    setIsLoading(false);
                    return;
                }
                detectionResult = await detectAiText(inputText);
            } else {
                if (!imageFile) {
                    setError('Por favor, selecciona una imagen para analizar.');
                    setIsLoading(false);
                    return;
                }
                detectionResult = await detectAiImage(imageFile);
            }
            setResult(detectionResult);
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error inesperado.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-indigo-500/30">
            <div className="w-full max-w-3xl mx-auto">
                <Header />
                <main className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 md:p-8 shadow-2xl">
                    <div className="flex justify-center space-x-4 mb-6">
                        <TabButton label="Analizar Texto" isActive={mode === DetectorMode.Text} onClick={() => handleModeChange(DetectorMode.Text)} />
                        <TabButton label="Analizar Imagen" isActive={mode === DetectorMode.Image} onClick={() => handleModeChange(DetectorMode.Image)} />
                    </div>

                    <div className="min-h-[250px]">
                        {mode === DetectorMode.Text ? (
                            <textarea
                                value={inputText}
                                onChange={(e) => { setInputText(e.target.value); resetState(); }}
                                placeholder="Pega aquí el texto que quieres analizar..."
                                className="w-full h-48 p-4 bg-slate-900/70 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-300 resize-none"
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center w-full">
                                <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-900/70 hover:bg-slate-800/70 transition-colors duration-300">
                                    {imagePreview ? (
                                         <img src={imagePreview} alt="Vista previa" className="max-h-full max-w-full object-contain rounded-lg" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-400">
                                            <UploadIcon className="w-10 h-10 mb-3" />
                                            <p className="mb-2 text-sm"><span className="font-semibold">Haz clic para subir</span> o arrastra y suelta</p>
                                            <p className="text-xs">PNG, JPG, WEBP (MAX. 4MB)</p>
                                        </div>
                                    )}
                                    <input id="image-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleImageChange} />
                                </label>
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-6">
                        <button 
                            onClick={handleAnalyse}
                            disabled={isLoading}
                            className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-500 disabled:bg-slate-500 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center"
                        >
                            {isLoading ? 'Analizando...' : `Analizar ${mode === DetectorMode.Text ? 'Texto' : 'Imagen'}`}
                        </button>
                    </div>

                    <div className="mt-4 min-h-[180px]">
                        {isLoading && <div className="pt-8"><Spinner /></div>}
                        {error && <p className="text-center text-red-400 p-4 bg-red-500/10 rounded-lg">{error}</p>}
                        {result !== null && <ResultDisplay isAi={result} />}
                    </div>
                </main>
                <footer className="text-center mt-8 text-slate-500 text-sm">
                    <p>Diseñado para fines académicos y de investigación.</p>
                </footer>
            </div>
        </div>
    );
};

export default App;
