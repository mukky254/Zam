// components/Dashboard.js
import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { jobsAPI, usersAPI, escapeHtml } from '../utils/api';
import styles from '../styles/dashboard.module.css';

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState('home');
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  const [jobFormData, setJobFormData] = useState({
    title: '',
    description: '',
    location: '',
    category: 'general',
    phone: '',
    businessType: ''
  });
  const [profileFormData, setProfileFormData] = useState({
    name: '',
    location: '',
    specialization: '',
    jobType: ''
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    position: '',
    location: '',
    date: 'all'
  });

  const {
    user,
    userRole,
    currentLanguage,
    darkMode,
    currentJobs,
    currentEmployees,
    userJobs,
    favoriteJobs,
    message,
    messageType,
    setJobs,
    setEmployees,
    setUserJobs,
    setFavorites,
    logout,
    setLanguage,
    toggleDarkMode,
    showMessage
  } = useApp();

  // Load data on component mount
  useEffect(() => {
    loadJobs();
    loadEmployees();
    if (userRole === 'employer') {
      loadUserJobs();
    }
  }, [userRole]);

  // Show messages
  useEffect(() => {
    if (message) {
      // Message is already handled by context
    }
  }, [message]);

  const loadJobs = async () => {
    try {
      const data = await jobsAPI.getAll();
      if (data.success) {
        setJobs(data.jobs || []);
      }
    } catch (error) {
      showMessage(
        currentLanguage === 'en' 
          ? 'Failed to load jobs' 
          : 'Imeshindwa kupakia kazi',
        'error'
      );
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await usersAPI.getEmployees();
      if (data.success) {
        setEmployees(data.employees || []);
      }
    } catch (error) {
      showMessage(
        currentLanguage === 'en' 
          ? 'Failed to load workers' 
          : 'Imeshindwa kupakia wafanyikazi',
        'error'
      );
    }
  };

  const loadUserJobs = async () => {
    try {
      if (user && user._id) {
        const data = await jobsAPI.getByEmployer(user._id);
        if (data.success) {
          setUserJobs(data.jobs || []);
        }
      }
    } catch (error) {
      // Fallback to filtering from all jobs
      const userJobs = currentJobs.filter(job => 
        job.employerId === user._id || 
        job.employerName === user.name
      );
      setUserJobs(userJobs);
    }
  };

  const handleJobSubmit = async (e) => {
    e.preventDefault();
    
    if (userRole !== 'employer') {
      showMessage(
        currentLanguage === 'en' 
          ? 'Only employers can post jobs' 
          : 'Ni waajiri pekee wanaweza kutangaza kazi',
        'error'
      );
      return;
    }

    const jobData = {
      ...jobFormData,
      employerId: user._id,
      employerName: user.name,
      language: currentLanguage
    };

    // Format phone number
    jobData.phone = jobData.phone.replace(/\D/g, '');
    if (jobData.phone.startsWith('0')) {
      jobData.phone = '254' + jobData.phone.substring(1);
    }

    try {
      await jobsAPI.create(jobData);
      
      showMessage(
        currentLanguage === 'en' 
          ? 'Job posted successfully!' 
          : 'Kazi imetangazwa kikamilifu!',
        'success'
      );
      
      setJobFormData({
        title: '',
        description: '',
        location: '',
        category: 'general',
        phone: '',
        businessType: ''
      });
      
      await loadJobs();
      setActiveSection('profile');
    } catch (error) {
      showMessage(
        error.message || 
        (currentLanguage === 'en' 
          ? 'Failed to post job' 
          : 'Imeshindwa kutangaza kazi'),
        'error'
      );
    }
  };

  const deleteJob = async (jobId) => {
    if (!confirm(
      currentLanguage === 'en' 
        ? 'Are you sure you want to delete this job?' 
        : 'Una uhakika unataka kufuta kazi hii?'
    )) return;

    try {
      await jobsAPI.delete(jobId);
      
      showMessage(
        currentLanguage === 'en' 
          ? 'Job deleted successfully!' 
          : 'Kazi imefutwa kikamilifu!',
        'success'
      );
      
      await loadJobs();
    } catch (error) {
      showMessage(
        error.message || 
        (currentLanguage === 'en' 
          ? 'Failed to delete job' 
          : 'Imeshindwa kufuta kazi'),
        'error'
      );
    }
  };

  const toggleFavorite = (job) => {
    const isFavorite = favoriteJobs.some(fav => fav._id === job._id);
    let newFavorites;

    if (isFavorite) {
      newFavorites = favoriteJobs.filter(fav => fav._id !== job._id);
      showMessage(
        currentLanguage === 'en' 
          ? 'Removed from favorites' 
          : 'Imeondolewa kwenye vipendwa',
        'success'
      );
    } else {
      newFavorites = [...favoriteJobs, job];
      showMessage(
        currentLanguage === 'en' 
          ? 'Added to favorites' 
          : 'Imeongezwa kwenye vipendwa',
        'success'
      );
    }

    setFavorites(newFavorites);
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    
    const updatedData = {
      name: profileFormData.name,
      location: profileFormData.location
    };

    if (userRole === 'employee') {
      updatedData.specialization = profileFormData.specialization;
    } else {
      updatedData.jobType = profileFormData.jobType;
    }

    try {
      await usersAPI.updateProfile(updatedData);
      
      // Update local user data
      const updatedUser = { ...user, ...updatedData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      showMessage(
        currentLanguage === 'en' 
          ? 'Profile updated successfully!' 
          : 'Wasifu umesasishwa kikamilifu!',
        'success'
      );
      
      setIsEditingProfile(false);
    } catch (error) {
      showMessage(
        error.message || 
        (currentLanguage === 'en' 
          ? 'Failed to update profile' 
          : 'Imeshindwa kusasisha wasifu'),
        'error'
      );
    }
  };

  const deleteAccount = async () => {
    if (!confirm(
      currentLanguage === 'en' 
        ? 'Are you sure you want to delete your account? This action cannot be undone.' 
        : 'Una uhakika unataka kufuta akaunti yako? Hatua hii haiwezi kubatilishwa.'
    )) return;

    try {
      await usersAPI.deleteProfile();
      
      showMessage(
        currentLanguage === 'en' 
          ? 'Account deleted successfully!' 
          : 'Akaunti imefutwa kikamilifu!',
        'success'
      );
      
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (error) {
      showMessage(
        error.message || 
        (currentLanguage === 'en' 
          ? 'Failed to delete account' 
          : 'Imeshindwa kufuta akaunti'),
        'error'
      );
    }
  };

  const shareJob = (job, platform) => {
    const jobTitle = job.title;
    const jobDescription = job.description.substring(0, 100) + '...';
    const jobLocation = job.location;
    const jobPhone = job.phone;
    
    let shareUrl = '';
    let shareText = '';
    
    if (currentLanguage === 'en') {
      shareText = `Job Opportunity: ${jobTitle} in ${jobLocation}. ${jobDescription} Contact: ${jobPhone}`;
    } else {
      shareText = `Fursa ya Kazi: ${jobTitle} katika ${jobLocation}. ${jobDescription} Wasiliana: ${jobPhone}`;
    }
    
    const encodedText = encodeURIComponent(shareText);
    
    switch(platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedText}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?quote=${encodedText}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
        break;
      default:
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const translations = {
    en: {
      welcome: "Welcome to Kazi Mashinani!",
      welcomeDesc: "Find your perfect job opportunity in rural areas",
      home: "Home",
      jobs: "Available Jobs",
      favorites: "Favorites",
      profile: "My Profile",
      postJob: "Post Job",
      findWorkers: "Find Workers",
      availableJobs: "Available Jobs",
      favoriteJobs: "Favorite Jobs",
      postJobOpportunity: "Post a Job Opportunity",
      findWorkers: "Find Workers",
      myProfile: "My Profile",
      myPostedJobs: "My Posted Jobs",
      quickActions: "Quick Actions",
      careerInsights: "Career Insights & Opportunities",
      browseJobs: "Browse Jobs",
      updateProfile: "Update Profile",
      postNewJob: "Post New Job",
      searchJobs: "Search Jobs",
      searchByPosition: "Search by Position",
      filterByLocation: "Filter by Location",
      datePosted: "Date Posted",
      anyTime: "Any Time",
      today: "Today",
      thisWeek: "This Week",
      thisMonth: "This Month",
      jobTitle: "Job Title *",
      jobDescription: "Job Description *",
      location: "Location *",
      category: "Category",
      phoneNumber: "Phone Number *",
      businessType: "Business Type",
      general: "General",
      agriculture: "Agriculture",
      construction: "Construction",
      domestic: "Domestic Work",
      driving: "Driving",
      retail: "Retail",
      personalInfo: "Personal Information",
      name: "Name",
      phone: "Phone",
      role: "Role",
      specialization: "Specialization",
      jobTypes: "Job Types",
      memberSince: "Member since",
      editProfile: "Edit Profile",
      deleteAccount: "Delete Account",
      save: "Save",
      cancel: "Cancel",
      call: "Call",
      whatsapp: "WhatsApp",
      share: "Share",
      edit: "Edit",
      delete: "Delete",
      noJobs: "No jobs available at the moment. Check back later!",
      noFavorites: "You haven't added any jobs to favorites yet.",
      noPostedJobs: "You haven't posted any jobs yet.",
      noWorkers: "No workers available at the moment.",
      highDemand: "High-Demand Skills in Rural Areas",
      highDemandDesc: "Agricultural expertise, construction skills, and domestic services are currently in high demand. Consider upskilling in these areas.",
      trustBuilding: "Building Trust in Rural Employment",
      trustBuildingDesc: "Maintain clear communication, provide references, and build long-term relationships with employers for sustained employment.",
      marketTrends: "Market Trends & Opportunities",
      marketTrendsDesc: "Seasonal farming opportunities peak during planting and harvest seasons. Construction projects increase during dry seasons.",
      profileTips: "Professional Profile Tips",
      profileTipsDesc: "Complete your profile with detailed skills, include work samples or references, and maintain an active presence for better opportunities.",
      logout: "Logout",
      aboutUs: "About Us",
      contactUs: "Contact Us",
      aboutDesc1: "Kazi Mashinani is dedicated to connecting job seekers with employment opportunities in rural areas. We believe that everyone deserves access to meaningful work, regardless of their location.",
      aboutDesc2: "We work with local communities to identify skills and match them with appropriate job opportunities. Our mission is to reduce unemployment in rural areas while helping businesses find the talent they need to grow.",
      aboutDesc3: "Our vision is a Kenya where no one is left behind in economic development. We strive to create sustainable employment solutions that benefit both workers and employers.",
      email: "Email",
      phone: "Phone"
    },
    sw: {
      welcome: "Karibu Kazi Mashinani!",
      welcomeDesc: "Tafuta fursa bora za kazi katika maeneo ya vijijini",
      home: "Nyumbani",
      jobs: "Kazi Zilizopo",
      favorites: "Vipendwa",
      profile: "Wasifu Wangu",
      postJob: "Tanga Kazi",
      findWorkers: "Tafuta Wafanyikazi",
      availableJobs: "Fursa Za Kazi Zilizopo",
      favoriteJobs: "Kazi Unazopenda",
      postJobOpportunity: "Tanga Fursa Ya Kazi",
      findWorkers: "Tafuta Wafanyikazi",
      myProfile: "Wasifu Wangu",
      myPostedJobs: "Kazi Nilizotangaza",
      quickActions: "Vitendo Vya Haraka",
      careerInsights: "Uchambuzi Wa Kazi Na Fursa",
      browseJobs: "Tafuta Kazi",
      updateProfile: "Sasisha Wasifu",
      postNewJob: "Tanga Kazi Mpya",
      searchJobs: "Tafuta Kazi",
      searchByPosition: "Tafuta kwa Nafasi",
      filterByLocation: "Chagua kwa Eneo",
      datePosted: "Tarehe Ilipotumwa",
      anyTime: "Wakati Wote",
      today: "Leo",
      thisWeek: "Wiki Hii",
      thisMonth: "Mwezi Huu",
      jobTitle: "Kichwa Cha Kazi *",
      jobDescription: "Maelezo Ya Kazi *",
      location: "Eneo *",
      category: "Aina",
      phoneNumber: "Nambari ya Simu *",
      businessType: "Aina ya Biashara",
      general: "Jumla",
      agriculture: "Kilimo",
      construction: "Ujenzi",
      domestic: "Kazi Ya Nyumbani",
      driving: "Udereva",
      retail: "Biashara",
      personalInfo: "Taarifa Binafsi",
      name: "Jina",
      phone: "Simu",
      role: "Jukumu",
      specialization: "Utaalamu",
      jobTypes: "Aina za Kazi",
      memberSince: "Mwanachama tangu",
      editProfile: "Hariri Wasifu",
      deleteAccount: "Futa Akaunti",
      save: "Hifadhi",
      cancel: "Ghairi",
      call: "Piga Simu",
      whatsapp: "WhatsApp",
      share: "Sambaza",
      edit: "Hariri",
      delete: "Futa",
      noJobs: "Hakuna kazi zinazopatikana kwa sasa. Angalia tena baadaye!",
      noFavorites: "Hujaongeza kazi yoyote kwenye orodha ya vipendwa bado.",
      noPostedJobs: "Hujatangaza kazi yoyote bado.",
      noWorkers: "Hakuna wafanyikazi walioopo kwa sasa.",
      highDemand: "Ujuzi Unaohitajika Sana Vijijini",
      highDemandDesc: "Utaalamu wa kilimo, ujuzi wa ujenzi, na huduma za nyumbani zinaongezeka kwa sasa. Fikiria kuboresha ujuzi katika maeneo haya.",
      trustBuilding: "Kujenga Uaminifu katika Ajira Vijijini",
      trustBuildingDesc: "Weka mawasiliano madhubuti, toa marejeo, na ujenge uhusiano wa muda mrefu na waajiri kwa ajira endelevu.",
      marketTrends: "Mienendo ya Soko na Fursa",
      marketTrendsDesc: "Fursa za kilimo za msimu hupanda wakati wa msimu wa kupanda na wa kuvuna. Miradi ya ujenzi huongezeka wakati wa msimu wa kiangazi.",
      profileTips: "Vidokezo vya Wasifu wa Kitaaluma",
      profileTipsDesc: "Kamilisha wasifu wako kwa ujuzi wa kina, jumuisha sampuli za kazi au marejeo, na kuweka uwepo amilifu kwa fursa bora.",
      logout: "Toka",
      aboutUs: "Kuhusu Sisi",
      contactUs: "Wasiliana Nasi",
      aboutDesc1: "Kazi Mashinani imejikita kuwaunganisha watafuta kazi na fursa za ajira katika maeneo ya vijijini. Tunaamini kwaka kila mtu anastahili kupata kazi yenye maana, bila kujali mahali walipo.",
      aboutDesc2: "Tunafanya kazi na jamii za kienyeji kubainisha ujuzi na kuwaunganisha na fursa zinazofaa za kazi. Dhamira yetu ni kupunguza ukosefu wa ajira katika maeneo ya vijijini huku tukisaidia biashara kupata talanta wanayohitaji ili kukua.",
      aboutDesc3: "Dira yetu ni Kenya ambapo hakuna mtu anayeachwa nyuma katika maendeleo ya kiuchumi. Tunajitahidi kuunda suluhisho za ajira endelevu zinazowafaidia wafanyikazi na waajiri.",
      email: "Barua Pepe",
      phone: "Simu"
    }
  };

  const t = translations[currentLanguage];

  const insights = [
    {
      icon: 'fas fa-trending-up',
      title: t.highDemand,
      content: t.highDemandDesc
    },
    {
      icon: 'fas fa-handshake',
      title: t.trustBuilding,
      content: t.trustBuildingDesc
    },
    {
      icon: 'fas fa-chart-bar',
      title: t.marketTrends,
      content: t.marketTrendsDesc
    },
    {
      icon: 'fas fa-user-check',
      title: t.profileTips,
      content: t.profileTipsDesc
    }
  ];

  const filteredJobs = currentJobs.filter(job => {
    const matchesPosition = searchFilters.position ? 
      job.title.toLowerCase().includes(searchFilters.position.toLowerCase()) : true;
    const matchesLocation = searchFilters.location ? 
      job.location.toLowerCase().includes(searchFilters.location.toLowerCase()) : true;
    
    return matchesPosition && matchesLocation;
  });

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logoSection}>
            <button 
              className={styles.menuToggle}
              onClick={() => setIsSideNavOpen(true)}
            >
              <i className="fas fa-bars"></i>
            </button>
            <div className={styles.logo}>
              <i className="fas fa-hands-helping"></i>
              <h1>Kazi Mashinani</h1>
            </div>
          </div>
          
          <div className={styles.headerControls}>
            <button className={styles.themeToggle} onClick={toggleDarkMode}>
              <i className={darkMode ? "fas fa-sun" : "fas fa-moon"}></i>
            </button>
            <div className={styles.languageSwitcher} onClick={() => setLanguage(currentLanguage === 'en' ? 'sw' : 'en')}>
              <div className={styles.languageFlag}>
                <span>{currentLanguage === 'en' ? '🇺🇸' : '🇰🇪'}</span>
              </div>
              <div className={styles.languageName}>
                {currentLanguage === 'en' ? 'English' : 'Kiswahili'}
              </div>
            </div>
          </div>
          
          <div className={styles.userSection}>
            <div className={styles.userInfo}>
              <div className={styles.userAvatar}>
                <i className="fas fa-user"></i>
              </div>
              <div>
                <div className={styles.userName}>{user?.name}</div>
                <div className={styles.userRoleBadge}>
                  {userRole === 'employee' ? t.jobSeeker : t.employer}
                </div>
              </div>
            </div>
            <button className={styles.btnLogout} onClick={logout}>
              <i className="fas fa-sign-out-alt"></i> {t.logout}
            </button>
          </div>
        </div>
      </header>

      {/* Side Navigation */}
      <div className={`${styles.sideNav} ${isSideNavOpen ? styles.active : ''}`}>
        <div className={styles.sideNavHeader}>
          <h2>Kazi Mashinani</h2>
          <button 
            className={styles.sideNavClose}
            onClick={() => setIsSideNavOpen(false)}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className={styles.sideNavSection}>
          <h3 onClick={() => setIsSideNavOpen(false)}>
            <i className="fas fa-info-circle"></i>
            {t.aboutUs}
          </h3>
          <p>{t.aboutDesc1}</p>
          <p>{t.aboutDesc2}</p>
          <p>{t.aboutDesc3}</p>
        </div>
        
        <div className={styles.sideNavSection}>
          <h3 onClick={() => setIsSideNavOpen(false)}>
            <i className="fas fa-address-card"></i>
            {t.contactUs}
          </h3>
          <div className={styles.sideNavContact}>
            <a href="mailto:myhassan19036@gmail.com" className={styles.contactItem}>
              <div className={styles.contactIcon}>
                <i className="fas fa-envelope"></i>
              </div>
              <div className={styles.contactInfo}>
                <div className={styles.contactLabel}>{t.email}</div>
                <div className={styles.contactValue}>myhassan19036@gmail.com</div>
              </div>
            </a>
            <a href="tel:+254790528837" className={styles.contactItem}>
              <div className={styles.contactIcon}>
                <i className="fas fa-phone"></i>
              </div>
              <div className={styles.contactInfo}>
                <div className={styles.contactLabel}>{t.phone}</div>
                <div className={styles.contactValue}>+254790528837</div>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Overlay for side nav */}
      {isSideNavOpen && (
        <div 
          className={styles.navOverlay}
          onClick={() => setIsSideNavOpen(false)}
        ></div>
      )}

      {/* Navigation */}
      {userRole === 'employee' && (
        <div className={styles.navContainer}>
          <div 
            className={`${styles.navItem} ${activeSection === 'home' ? styles.active : ''}`}
            onClick={() => setActiveSection('home')}
          >
            <i className="fas fa-home"></i> {t.home}
          </div>
          <div 
            className={`${styles.navItem} ${activeSection === 'jobs' ? styles.active : ''}`}
            onClick={() => setActiveSection('jobs')}
          >
            <i className="fas fa-briefcase"></i> {t.jobs}
          </div>
          <div 
            className={`${styles.navItem} ${activeSection === 'favorites' ? styles.active : ''}`}
            onClick={() => setActiveSection('favorites')}
          >
            <i className="fas fa-heart"></i> {t.favorites}
          </div>
          <div 
            className={`${styles.navItem} ${activeSection === 'profile' ? styles.active : ''}`}
            onClick={() => setActiveSection('profile')}
          >
            <i className="fas fa-user"></i> {t.profile}
          </div>
        </div>
      )}

      {userRole === 'employer' && (
        <div className={styles.navContainer}>
          <div 
            className={`${styles.navItem} ${activeSection === 'home' ? styles.active : ''}`}
            onClick={() => setActiveSection('home')}
          >
            <i className="fas fa-home"></i> {t.home}
          </div>
          <div 
            className={`${styles.navItem} ${activeSection === 'post' ? styles.active : ''}`}
            onClick={() => setActiveSection('post')}
          >
            <i className="fas fa-plus-circle"></i> {t.postJob}
          </div>
          <div 
            className={`${styles.navItem} ${activeSection === 'employees' ? styles.active : ''}`}
            onClick={() => setActiveSection('employees')}
          >
            <i className="fas fa-users"></i> {t.findWorkers}
          </div>
          <div 
            className={`${styles.navItem} ${activeSection === 'profile' ? styles.active : ''}`}
            onClick={() => setActiveSection('profile')}
          >
            <i className="fas fa-user"></i> {t.profile}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={styles.mainContainer}>
        {/* Message Display */}
        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}

        {/* Home Section */}
        {activeSection === 'home' && (
          <section className={styles.pageSection}>
            <div className={styles.welcomeSection}>
              <h1>{t.welcome}</h1>
              <p>{t.welcomeDesc}</p>
            </div>

            {/* Stats Section */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <i className="fas fa-briefcase"></i>
                </div>
                <div className={styles.statContent}>
                  <h3>{currentJobs.length}</h3>
                  <p>{t.availableJobs}</p>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <i className="fas fa-users"></i>
                </div>
                <div className={styles.statContent}>
                  <h3>{currentEmployees.length}</h3>
                  <p>{userRole === 'employee' ? 'Active Workers' : 'Available Workers'}</p>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <i className="fas fa-building"></i>
                </div>
                <div className={styles.statContent}>
                  <h3>{userRole === 'employee' ? '50' : userJobs.length}</h3>
                  <p>{userRole === 'employee' ? 'Business Partners' : 'Posted Jobs'}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className={styles.container}>
              <div className={styles.sectionHeader}>
                <i className="fas fa-bolt"></i>
                <h2>{t.quickActions}</h2>
              </div>
              <div className={styles.quickActionsGrid}>
                {userRole === 'employee' ? (
                  <>
                    <button 
                      className={`${styles.actionBtn} ripple`}
                      onClick={() => setActiveSection('jobs')}
                    >
                      <i className="fas fa-search"></i> {t.browseJobs}
                    </button>
                    <button 
                      className={`${styles.actionBtn} ripple`}
                      onClick={() => setActiveSection('favorites')}
                    >
                      <i className="fas fa-heart"></i> {t.favorites}
                    </button>
                    <button 
                      className={`${styles.actionBtn} ripple`}
                      onClick={() => setActiveSection('profile')}
                    >
                      <i className="fas fa-user-edit"></i> {t.updateProfile}
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      className={`${styles.actionBtn} ripple`}
                      onClick={() => setActiveSection('post')}
                    >
                      <i className="fas fa-plus"></i> {t.postNewJob}
                    </button>
                    <button 
                      className={`${styles.actionBtn} ripple`}
                      onClick={() => setActiveSection('employees')}
                    >
                      <i className="fas fa-search"></i> {t.findWorkers}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Professional Insights */}
            <div className={styles.container}>
              <div className={styles.sectionHeader}>
                <i className="fas fa-chart-line"></i>
                <h2>{t.careerInsights}</h2>
              </div>
              
              <div className={styles.insightsGrid}>
                {insights.map((insight, index) => (
                  <div key={index} className={styles.insightCard}>
                    <div className={styles.insightIcon}>
                      <i className={insight.icon}></i>
                    </div>
                    <div className={styles.insightTitle}>{insight.title}</div>
                    <div className={styles.insightContent}>{insight.content}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Jobs Section */}
        {activeSection === 'jobs' && userRole === 'employee' && (
          <section className={styles.pageSection}>
            <div className={styles.container}>
              <div className={styles.sectionHeader}>
                <i className="fas fa-briefcase"></i>
                <h2>{t.availableJobs}</h2>
              </div>
              
              {/* Search Bar */}
              <div className={styles.searchContainer}>
                <div className={styles.searchForm}>
                  <div className="form-group">
                    <label>{t.searchByPosition}</label>
                    <input
                      type="text"
                      value={searchFilters.position}
                      onChange={(e) => setSearchFilters(prev => ({
                        ...prev,
                        position: e.target.value
                      }))}
                      placeholder="Search by job title..."
                    />
                  </div>
                  <div className="form-group">
                    <label>{t.filterByLocation}</label>
                    <input
                      type="text"
                      value={searchFilters.location}
                      onChange={(e) => setSearchFilters(prev => ({
                        ...prev,
                        location: e.target.value
                      }))}
                      placeholder="Filter by location..."
                    />
                  </div>
                </div>
              </div>
              
              <div className={styles.jobGrid}>
                {filteredJobs.length === 0 ? (
                  <div className="message">
                    <i className="fas fa-info-circle"></i> 
                    {t.noJobs}
                  </div>
                ) : (
                  filteredJobs.map(job => {
                    const isFavorite = favoriteJobs.some(fav => fav._id === job._id);
                    
                    return (
                      <div key={job._id} className={styles.jobCard}>
                        <div className={styles.jobActions}>
                          <button 
                            className={`${styles.btnFavorite} ${isFavorite ? styles.active : ''}`}
                            onClick={() => toggleFavorite(job)}
                          >
                            <i className="fas fa-heart"></i>
                          </button>
                        </div>
                        <div className={styles.jobHeader}>
                          <div className={styles.jobTitle}>{escapeHtml(job.title)}</div>
                          <div className={styles.jobCategory}>{job.category}</div>
                        </div>
                        <div className={styles.jobDescription}>
                          {escapeHtml(job.description)}
                        </div>
                        <div className={styles.jobMeta}>
                          <div className={styles.metaItem}>
                            <i className="fas fa-map-marker-alt"></i>
                            <span>{job.location}</span>
                          </div>
                          <div className={styles.metaItem}>
                            <i className="fas fa-building"></i>
                            <span>{job.businessType || 'Individual'}</span>
                          </div>
                          <div className={styles.metaItem}>
                            <i className="fas fa-calendar"></i>
                            <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className={styles.communication}>
                          <a href={`tel:${job.phone}`} className={`btn ${styles.btnCall}`}>
                            <i className="fas fa-phone"></i> {t.call}
                          </a>
                          <a 
                            href={`https://wa.me/${job.phone}?text=Hi, I am interested in the ${encodeURIComponent(job.title)} position`}
                            className={`btn ${styles.btnWhatsapp}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <i className="fab fa-whatsapp"></i> {t.whatsapp}
                          </a>
                        </div>
                        <div className={styles.socialSharing}>
                          <button 
                            className={styles.btnShare}
                            onClick={() => shareJob(job, 'whatsapp')}
                          >
                            <i className="fas fa-share-alt"></i> {t.share}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        )}

        {/* Favorites Section */}
        {activeSection === 'favorites' && userRole === 'employee' && (
          <section className={styles.pageSection}>
            <div className={styles.container}>
              <div className={styles.sectionHeader}>
                <i className="fas fa-heart"></i>
                <h2>{t.favoriteJobs}</h2>
              </div>
              
              <div className={styles.jobGrid}>
                {favoriteJobs.length === 0 ? (
                  <div className="message">
                    <i className="fas fa-info-circle"></i> 
                    {t.noFavorites}
                  </div>
                ) : (
                  favoriteJobs.map(job => (
                    <div key={job._id} className={styles.jobCard}>
                      <div className={styles.jobActions}>
                        <button 
                          className={`${styles.btnFavorite} ${styles.active}`}
                          onClick={() => toggleFavorite(job)}
                        >
                          <i className="fas fa-heart"></i>
                        </button>
                      </div>
                      <div className={styles.jobHeader}>
                        <div className={styles.jobTitle}>{escapeHtml(job.title)}</div>
                        <div className={styles.jobCategory}>{job.category}</div>
                      </div>
                      <div className={styles.jobDescription}>
                        {escapeHtml(job.description)}
                      </div>
                      <div className={styles.jobMeta}>
                        <div className={styles.metaItem}>
                          <i className="fas fa-map-marker-alt"></i>
                          <span>{job.location}</span>
                        </div>
                        <div className={styles.metaItem}>
                          <i className="fas fa-building"></i>
                          <span>{job.businessType || 'Individual'}</span>
                        </div>
                        <div className={styles.metaItem}>
                          <i className="fas fa-calendar"></i>
                          <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className={styles.communication}>
                        <a href={`tel:${job.phone}`} className={`btn ${styles.btnCall}`}>
                          <i className="fas fa-phone"></i> {t.call}
                        </a>
                        <a 
                          href={`https://wa.me/${job.phone}?text=Hi, I am interested in the ${encodeURIComponent(job.title)} position`}
                          className={`btn ${styles.btnWhatsapp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <i className="fab fa-whatsapp"></i> {t.whatsapp}
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}

        {/* Post Job Section */}
        {activeSection === 'post' && userRole === 'employer' && (
          <section className={styles.pageSection}>
            <div className={styles.container}>
              <div className={styles.sectionHeader}>
                <i className="fas fa-plus-circle"></i>
                <h2>{t.postJobOpportunity}</h2>
              </div>
              
              <form onSubmit={handleJobSubmit}>
                <div className="form-group">
                  <label>{t.jobTitle}</label>
                  <input
                    type="text"
                    value={jobFormData.title}
                    onChange={(e) => setJobFormData(prev => ({
                      ...prev,
                      title: e.target.value
                    }))}
                    placeholder="e.g., Farm Worker, Construction Helper"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>{t.jobDescription}</label>
                  <textarea
                    value={jobFormData.description}
                    onChange={(e) => setJobFormData(prev => ({
                      ...prev,
                      description: e.target.value
                    }))}
                    rows="4"
                    placeholder="Describe the job responsibilities and requirements..."
                    required
                  ></textarea>
                </div>
                
                <div className={styles.formRow}>
                  <div className="form-group">
                    <label>{t.location}</label>
                    <input
                      type="text"
                      value={jobFormData.location}
                      onChange={(e) => setJobFormData(prev => ({
                        ...prev,
                        location: e.target.value
                      }))}
                      placeholder="e.g., Nairobi, Nakuru"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>{t.category}</label>
                    <select
                      value={jobFormData.category}
                      onChange={(e) => setJobFormData(prev => ({
                        ...prev,
                        category: e.target.value
                      }))}
                    >
                      <option value="general">{t.general}</option>
                      <option value="agriculture">{t.agriculture}</option>
                      <option value="construction">{t.construction}</option>
                      <option value="domestic">{t.domestic}</option>
                      <option value="driving">{t.driving}</option>
                      <option value="retail">{t.retail}</option>
                    </select>
                  </div>
                </div>
                
                <div className={styles.formRow}>
                  <div className="form-group">
                    <label>{t.phoneNumber}</label>
                    <input
                      type="tel"
                      value={jobFormData.phone}
                      onChange={(e) => setJobFormData(prev => ({
                        ...prev,
                        phone: e.target.value
                      }))}
                      placeholder="0712345678"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>{t.businessType}</label>
                    <input
                      type="text"
                      value={jobFormData.businessType}
                      onChange={(e) => setJobFormData(prev => ({
                        ...prev,
                        businessType: e.target.value
                      }))}
                      placeholder="e.g., Farm, Construction Company"
                    />
                  </div>
                </div>
                
                <button type="submit" className="btn btn-primary">
                  <i className="fas fa-paper-plane"></i> {t.postJob}
                </button>
              </form>
            </div>
          </section>
        )}

        {/* Employees Section */}
        {activeSection === 'employees' && userRole === 'employer' && (
          <section className={styles.pageSection}>
            <div className={styles.container}>
              <div className={styles.sectionHeader}>
                <i className="fas fa-users"></i>
                <h2>{t.findWorkers}</h2>
              </div>
              
              <div className={styles.jobGrid}>
                {currentEmployees.length === 0 ? (
                  <div className="message">
                    <i className="fas fa-info-circle"></i> 
                    {t.noWorkers}
                  </div>
                ) : (
                  currentEmployees.map(employee => (
                    <div key={employee._id} className={styles.jobCard}>
                      <div className={styles.jobHeader}>
                        <div className={styles.jobTitle}>{employee.name}</div>
                        <div className={styles.jobCategory}>{employee.role}</div>
                      </div>
                      <div className={styles.jobDescription}>
                        <strong>{t.specialization}:</strong> {employee.specialization || 'General worker'}
                      </div>
                      <div className={styles.jobMeta}>
                        <div className={styles.metaItem}>
                          <i className="fas fa-map-marker-alt"></i>
                          <span>{employee.location}</span>
                        </div>
                        <div className={styles.metaItem}>
                          <i className="fas fa-phone"></i>
                          <span>{employee.phone}</span>
                        </div>
                        <div className={styles.metaItem}>
                          <i className="fas fa-calendar"></i>
                          <span>Joined {new Date(employee.joinDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className={styles.communication}>
                        <a href={`tel:${employee.phone}`} className={`btn ${styles.btnCall}`}>
                          <i className="fas fa-phone"></i> {t.call}
                        </a>
                        <a 
                          href={`https://wa.me/${employee.phone}?text=Hi, I have a job opportunity for you`}
                          className={`btn ${styles.btnWhatsapp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <i className="fab fa-whatsapp"></i> {t.whatsapp}
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}

        {/* Profile Section */}
        {activeSection === 'profile' && (
          <section className={styles.pageSection}>
            <div className={styles.container}>
              <div className={styles.sectionHeader}>
                <i className="fas fa-user"></i>
                <h2>{t.myProfile}</h2>
              </div>
              
              <div className={styles.profileContent}>
                <div className={styles.profileInfo}>
                  <h3>{t.personalInfo}</h3>
                  <div className={styles.profileDetails}>
                    <div className={styles.detailItem}>
                      <strong>{t.name}:</strong> <span>{user?.name}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <strong>{t.phone}:</strong> <span>{user?.phone}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <strong>{t.location}:</strong> <span>{user?.location}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <strong>{t.role}:</strong> <span>
                        {userRole === 'employee' ? t.jobSeeker : t.employer}
                      </span>
                    </div>
                    {userRole === 'employee' && (
                      <div className={styles.detailItem}>
                        <strong>{t.specialization}:</strong> <span>{user?.specialization || 'Not specified'}</span>
                      </div>
                    )}
                    {userRole === 'employer' && (
                      <div className={styles.detailItem}>
                        <strong>{t.jobTypes}:</strong> <span>{user?.jobType || 'Not specified'}</span>
                      </div>
                    )}
                    <div className={styles.detailItem}>
                      <strong>{t.memberSince}:</strong> <span>
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className={styles.profileActions}>
                    <button 
                      className="btn btn-primary"
                      onClick={() => {
                        setIsEditingProfile(true);
                        setProfileFormData({
                          name: user?.name || '',
                          location: user?.location || '',
                          specialization: user?.specialization || '',
                          jobType: user?.jobType || ''
                        });
                      }}
                    >
                      <i className="fas fa-edit"></i> {t.editProfile}
                    </button>
                    <button 
                      className={styles.btnLogout}
                      onClick={deleteAccount}
                    >
                      <i className="fas fa-trash"></i> {t.deleteAccount}
                    </button>
                  </div>
                </div>

                {isEditingProfile && (
                  <div className={styles.profileForm}>
                    <h3>{t.editProfile}</h3>
                    <form onSubmit={updateProfile}>
                      <div className="form-group">
                        <label>{t.fullName}</label>
                        <input
                          type="text"
                          value={profileFormData.name}
                          onChange={(e) => setProfileFormData(prev => ({
                            ...prev,
                            name: e.target.value
                          }))}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>{t.location}</label>
                        <input
                          type="text"
                          value={profileFormData.location}
                          onChange={(e) => setProfileFormData(prev => ({
                            ...prev,
                            location: e.target.value
                          }))}
                          required
                        />
                      </div>
                      {userRole === 'employee' && (
                        <div className="form-group">
                          <label>{t.specialization}</label>
                          <input
                            type="text"
                            value={profileFormData.specialization}
                            onChange={(e) => setProfileFormData(prev => ({
                              ...prev,
                              specialization: e.target.value
                            }))}
                          />
                        </div>
                      )}
                      {userRole === 'employer' && (
                        <div className="form-group">
                          <label>{t.jobTypes}</label>
                          <input
                            type="text"
                            value={profileFormData.jobType}
                            onChange={(e) => setProfileFormData(prev => ({
                              ...prev,
                              jobType: e.target.value
                            }))}
                          />
                        </div>
                      )}
                      <div className={styles.formActions}>
                        <button type="submit" className="btn btn-primary">
                          <i className="fas fa-save"></i> {t.save}
                        </button>
                        <button 
                          type="button"
                          className={styles.btnLogout}
                          onClick={() => setIsEditingProfile(false)}
                        >
                          <i className="fas fa-times"></i> {t.cancel}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {/* Employer's Posted Jobs */}
              {userRole === 'employer' && (
                <div className={styles.employerJobs}>
                  <div className={styles.sectionHeader}>
                    <i className="fas fa-list"></i>
                    <h2>{t.myPostedJobs}</h2>
                  </div>
                  <div className={styles.jobGrid}>
                    {userJobs.length === 0 ? (
                      <div className="message">
                        <i className="fas fa-info-circle"></i> 
                        {t.noPostedJobs}
                      </div>
                    ) : (
                      userJobs.map(job => (
                        <div key={job._id} className={styles.jobCard}>
                          <div className={styles.jobActions}>
                            <button 
                              className={`${styles.btnAction} ${styles.btnEdit}`}
                              onClick={() => {
                                // Edit job functionality would go here
                                showMessage('Edit feature coming soon', 'info');
                              }}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button 
                              className={`${styles.btnAction} ${styles.btnDelete}`}
                              onClick={() => deleteJob(job._id)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                          <div className={styles.jobHeader}>
                            <div className={styles.jobTitle}>{escapeHtml(job.title)}</div>
                            <div className={styles.jobCategory}>{job.category}</div>
                          </div>
                          <div className={styles.jobDescription}>
                            {escapeHtml(job.description)}
                          </div>
                          <div className={styles.jobMeta}>
                            <div className={styles.metaItem}>
                              <i className="fas fa-map-marker-alt"></i>
                              <span>{job.location}</span>
                            </div>
                            <div className={styles.metaItem}>
                              <i className="fas fa-building"></i>
                              <span>{job.businessType || 'Individual'}</span>
                            </div>
                            <div className={styles.metaItem}>
                              <i className="fas fa-calendar"></i>
                              <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className={styles.communication}>
                            <span className={styles.metaItem}>
                              <i className="fas fa-phone"></i>
                              <span>{job.phone}</span>
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div>
            <h3>
              {userRole === 'employee' 
                ? 'Kazi Mashinani - Empowering Rural Job Seekers'
                : 'Kazi Mashinani - Connecting Employers with Rural Talent'
              }
            </h3>
          </div>
          <div className={styles.footerContact}>
            <div 
              className={styles.contactIcon}
              onClick={() => window.location.href = 'mailto:myhassan19036@gmail.com'}
            >
              <i className="fas fa-envelope"></i>
            </div>
            <div 
              className={styles.contactIcon}
              onClick={() => window.location.href = 'tel:+254790528837'}
            >
              <i className="fas fa-phone"></i>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
