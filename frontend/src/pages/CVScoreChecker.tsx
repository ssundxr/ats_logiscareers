import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Loader2, Sparkles, Target, GraduationCap, Briefcase } from 'lucide-react';
import { cvCheckerApi, CVScoreResult, CVScoreHighlight } from '../services/api';

const CVScoreChecker = () => {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [experienceYears, setExperienceYears] = useState<number>(0);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CVScoreResult | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCvFile(e.target.files[0]);
      setResult(null);
      setError('');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setCvFile(file);
        setResult(null);
        setError('');
      } else {
        setError('Please upload a PDF file');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cvFile) {
      setError('Please upload a CV file');
      return;
    }
    if (!jobTitle.trim()) {
      setError('Please enter a job title');
      return;
    }
    if (!requiredSkills.trim()) {
      setError('Please enter required skills');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await cvCheckerApi.checkScore({
        cv_file: cvFile,
        job_title: jobTitle,
        required_skills: requiredSkills,
        experience_years: experienceYears,
        job_description: jobDescription,
      });
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to check CV score. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderHighlightedText = (text: string, highlights: CVScoreHighlight[]) => {
    if (!highlights || highlights.length === 0) {
      return <p className="whitespace-pre-wrap text-gray-700">{text}</p>;
    }

    // Sort highlights by start position
    const sortedHighlights = [...highlights].sort((a, b) => a.start - b.start);

    const elements: JSX.Element[] = [];
    let lastIndex = 0;

    sortedHighlights.forEach((highlight, index) => {
      // Add text before highlight
      if (highlight.start > lastIndex) {
        elements.push(
          <span key={`text-${index}`}>{text.slice(lastIndex, highlight.start)}</span>
        );
      }

      // Add highlighted text
      const highlightClass = highlight.type === 'skill_match'
        ? 'bg-green-200 text-green-800 px-1 rounded font-medium'
        : 'bg-blue-100 text-blue-700 px-1 rounded';

      elements.push(
        <span
          key={`highlight-${index}`}
          className={highlightClass}
          title={highlight.type === 'skill_match' ? `Matched: ${highlight.skill}` : `Found skill: ${highlight.skill}`}
        >
          {highlight.text}
        </span>
      );

      lastIndex = highlight.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(<span key="text-end">{text.slice(lastIndex)}</span>);
    }

    return <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">{elements}</p>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    if (score >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 75) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    if (score >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 75) return 'from-green-500 to-emerald-600';
    if (score >= 50) return 'from-yellow-500 to-amber-600';
    if (score >= 25) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-rose-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CV Score Checker</h1>
          <p className="text-gray-600">Upload a CV and check how well it matches your job requirements</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2 text-indigo-600" />
            Job Requirements & CV Upload
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* File Upload */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200
                ${cvFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              {cvFile ? (
                <div className="flex items-center justify-center space-x-2">
                  <FileText className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-medium text-green-700">{cvFile.name}</p>
                    <p className="text-sm text-green-600">Click to change file</p>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 font-medium">Drop your CV here or click to upload</p>
                  <p className="text-sm text-gray-500 mt-1">PDF files only</p>
                </div>
              )}
            </div>

            {/* Job Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Title *
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g., Senior Software Engineer"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Required Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Required Skills * (comma-separated)
              </label>
              <textarea
                value={requiredSkills}
                onChange={(e) => setRequiredSkills(e.target.value)}
                placeholder="e.g., Python, JavaScript, React, Django, PostgreSQL, AWS"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Experience Years */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Experience (years)
              </label>
              <input
                type="number"
                value={experienceYears}
                onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
                min={0}
                max={30}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Job Description (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Description (optional)
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description for additional skill extraction..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium
                hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2
                disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Analyzing CV...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  <span>Check CV Score</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          {result ? (
            <>
              {/* Score Card */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-800">Match Score</h2>
                  <span className="text-sm text-gray-500">{result.job_title}</span>
                </div>

                {/* Circular Score */}
                <div className="flex justify-center mb-6">
                  <div className={`relative w-40 h-40 rounded-full bg-gradient-to-br ${getScoreGradient(result.match_percentage)} p-2`}>
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                      <div className="text-center">
                        <span className={`text-4xl font-bold ${getScoreColor(result.match_percentage)}`}>
                          {result.match_percentage}%
                        </span>
                        <p className="text-sm text-gray-500 mt-1">Match</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-6">
                  <div
                    className={`h-full ${getScoreBg(result.match_percentage)} transition-all duration-500`}
                    style={{ width: `${result.match_percentage}%` }}
                  />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center text-gray-600 mb-1">
                      <Briefcase className="h-4 w-4 mr-1" />
                      Experience
                    </div>
                    <p className="font-semibold">
                      {result.cv_experience_years} years
                      {result.experience_match ? (
                        <span className="text-green-600 ml-1">✓</span>
                      ) : (
                        <span className="text-red-500 ml-1">(Need {result.required_experience_years})</span>
                      )}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center text-gray-600 mb-1">
                      <GraduationCap className="h-4 w-4 mr-1" />
                      Education
                    </div>
                    <p className="font-semibold">{result.cv_education || 'Not detected'}</p>
                  </div>
                </div>
              </div>

              {/* Skills Analysis */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Skills Analysis</h2>

                <div className="space-y-4">
                  {/* Matched Skills */}
                  <div>
                    <div className="flex items-center text-green-700 mb-2">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span className="font-medium">
                        Matched Skills ({result.matched_skills.length}/{result.required_skills.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {result.matched_skills.length > 0 ? (
                        result.matched_skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">No skills matched</span>
                      )}
                    </div>
                  </div>

                  {/* Missing Skills */}
                  <div>
                    <div className="flex items-center text-red-600 mb-2">
                      <XCircle className="h-5 w-5 mr-2" />
                      <span className="font-medium">
                        Missing Skills ({result.missing_skills.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {result.missing_skills.length > 0 ? (
                        result.missing_skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-medium"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">All required skills found!</span>
                      )}
                    </div>
                  </div>

                  {/* Other Skills Found */}
                  {result.cv_skills.filter(s => !result.matched_skills.map(m => m.toLowerCase()).includes(s.toLowerCase())).length > 0 && (
                    <div>
                      <div className="flex items-center text-blue-600 mb-2">
                        <Sparkles className="h-5 w-5 mr-2" />
                        <span className="font-medium">Additional Skills in CV</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {result.cv_skills
                          .filter(s => !result.matched_skills.map(m => m.toLowerCase()).includes(s.toLowerCase()))
                          .map((skill, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm"
                            >
                              {skill}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Upload a CV and enter job requirements</p>
              <p className="text-gray-500 text-sm mt-1">Results will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* CV Text with Highlights */}
      {result && result.cv_text && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">CV Content with Highlighted Skills</h2>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <span className="w-4 h-4 bg-green-200 rounded mr-2"></span>
                <span className="text-gray-600">Matched Skills</span>
              </div>
              <div className="flex items-center">
                <span className="w-4 h-4 bg-blue-100 rounded mr-2"></span>
                <span className="text-gray-600">Other Skills Found</span>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto bg-gray-50">
            {renderHighlightedText(result.cv_text, result.highlights)}
          </div>
        </div>
      )}
    </div>
  );
};

export default CVScoreChecker;
