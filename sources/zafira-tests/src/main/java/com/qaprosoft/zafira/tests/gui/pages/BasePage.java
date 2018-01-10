package com.qaprosoft.zafira.tests.gui.pages;

import org.openqa.selenium.WebDriver;
import com.qaprosoft.zafira.tests.gui.components.Header;
import com.qaprosoft.zafira.tests.gui.components.Navbar;

public abstract class BasePage extends AbstractPage
{

	private Header header;
	private Navbar navbar;

	protected BasePage(WebDriver driver, String path)
	{
		super(driver, path);
		this.header = new Header(driver, path);
		this.navbar = new Navbar(driver, path);
	}

	public Header getHeader()
	{
		return header;
	}

	public Navbar getNavbar()
	{
		return navbar;
	}

	public boolean waitUtilPageLoading(long seconds)
	{
		return isElementPresent(header.getLoadingBarSpinnerLocator(), seconds) &&
				waitUntilElementPresent(header.getLoadingBarSpinnerLocator(), 20);
	}
}
