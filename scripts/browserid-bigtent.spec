%define _rootdir /opt/bigtent

Name:          browserid-bigtent
Version:       0.2013.01.17
Release:       15%{?dist}_%{svnrev}
Summary:       BrowserID BigTent server
Packager:      Pete Fritchman <petef@mozilla.com>
Group:         Development/Libraries
License:       MPL 2.0
URL:           https://github.com/mozilla/browserid-bigtent
Source0:       %{name}.tar.gz
BuildRoot:     %{_tmppath}/%{name}-%{version}-%{release}-root
AutoReqProv:   no
Requires:      openssl nodejs
BuildRequires: gcc-c++ git jre make npm openssl-devel expat-devel

%description
BrowserID BigTent: server providing proxy IdP authentication.

%prep
%setup -q -c -n browserid-bigtent

%build
npm install
export PATH=$PWD/node_modules/.bin:$PATH
mkdir -p static/i18n/en_US
compile-json locale/ static/i18n/
env CONFIG_FILES=$PWD/server/config/production.json scripts/compress
echo "$GIT_REVISION" > static/ver.txt
echo "locale svn r$SVN_REVISION" >> static/ver.txt

%install
rm -rf %{buildroot}
mkdir -p %{buildroot}%{_rootdir}/server
for f in server/{bin,lib,views,*.js}; do
    cp -rp $f %{buildroot}%{_rootdir}/server/
done
for f in node_modules static; do
    cp -rp $f %{buildroot}%{_rootdir}/
done
mkdir -p %{buildroot}%{_rootdir}/config
cp -p server/config/l10n-all.json %{buildroot}%{_rootdir}/config
cp -p server/config/l10n-prod.json %{buildroot}%{_rootdir}/config
# now let's link en to en-US
ln -s en-US %{buildroot}%{_rootdir}/static/i18n/en

%clean
rm -rf %{buildroot}

%files
%defattr(-,root,root,-)
%{_rootdir}

%changelog
* Fri Jun  1 2012 Pete Fritchman <petef@mozilla.com>
- Initial version
