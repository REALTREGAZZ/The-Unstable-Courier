const RANKING_STORAGE_KEY = 'unstableCourierRanking';

export class RankingSystem {
  constructor() {
    this.ranking = this.loadRanking();
  }
  
  loadRanking() {
    try {
      const data = localStorage.getItem(RANKING_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error loading ranking:', e);
    }
    
    // Default ranking structure
    return {
      topScores: [],
      recordTime: Infinity,
      recordHolder: ''
    };
  }
  
  saveRanking() {
    try {
      localStorage.setItem(RANKING_STORAGE_KEY, JSON.stringify(this.ranking));
    } catch (e) {
      console.error('Error saving ranking:', e);
    }
  }
  
  saveScore(name, score, integrityPercent, elapsedTime) {
    // Validate name (3 uppercase letters)
    if (!this.isValidName(name)) {
      console.error('Invalid name format');
      return false;
    }
    
    const timestamp = new Date().toISOString();
    
    // Add to top scores
    this.ranking.topScores.push({
      name,
      score,
      integrityPercent,
      elapsedTime,
      timestamp
    });
    
    // Sort by score (descending)
    this.ranking.topScores.sort((a, b) => b.score - a.score);
    
    // Keep only top 5
    this.ranking.topScores = this.ranking.topScores.slice(0, 5);
    
    // Update record if this is the best time
    if (elapsedTime < this.ranking.recordTime) {
      this.ranking.recordTime = elapsedTime;
      this.ranking.recordHolder = name;
    }
    
    this.saveRanking();
    return true;
  }
  
  isTopScore(score) {
    if (this.ranking.topScores.length < 5) {
      return true;
    }
    return score > this.ranking.topScores[4].score;
  }
  
  getTopScores() {
    return this.ranking.topScores;
  }
  
  getRecordTime() {
    return this.ranking.recordTime;
  }
  
  getRecordHolder() {
    return this.ranking.recordHolder;
  }
  
  isValidName(name) {
    return /^[A-Z]{3}$/.test(name);
  }
  
  getScoreNeededForTop5() {
    if (this.ranking.topScores.length < 5) {
      return 0;
    }
    return this.ranking.topScores[4].score + 1;
  }
}